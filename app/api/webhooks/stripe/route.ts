import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";
import { sendTiktokEvent } from "../../../../lib/tiktokEventsApi";
import { sendGA4Purchase, extractGa4ClientId } from "../../../../lib/ga4";
import { getStripeServerClient } from "../../../../lib/stripe";
import { createRegistrationToken } from "../../../../lib/auth";
import { sendWelcomeEmail, sendPurchaseConfirmationEmail, sendDatingConfirmationEmail } from "../../../../lib/email";
import { postDatingOrderRoot } from "../../../../lib/datingSlackFeed";
import { promoteLeadToCustomer } from "../../../../lib/klaviyo";
import { supabaseAdmin } from "../../../../lib/supabase";
import { postToSlack } from "../../../../lib/slack";

export const runtime = "nodejs";

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = getStripeServerClient();

const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    console.error("[webhook/stripe] Stripe not configured — missing secret key or webhook secret");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    console.error("[webhook/stripe] Invalid signature", { error: String(error) });
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = (pi.metadata ?? {}) as Record<string, string>;
    const stripeCustomerId =
      typeof pi.customer === "string" ? pi.customer : null;

    // capi_purchase_source tells us which flow created this PaymentIntent:
    //   "checkout_session" → created by a Stripe Checkout Session, already
    //                        handled by checkout.session.completed — skip to avoid
    //                        double-counting in Meta with a different event_id.
    //   "payment_intent"   → created directly by our embedded checkout flow.
    //   absent             → external payment (Stripe dashboard, link, etc.) —
    //                        still process so no purchase is ever silently lost.
    const capiSource = meta.capi_purchase_source ?? null;

    console.log("[webhook/stripe] payment_intent.succeeded", {
      paymentIntentId: pi.id,
      amount: pi.amount,
      funnel: meta.funnel,
      capiSource,
    });

    // Fan-out to Slack #sales for every PaymentIntent succeeded — the PI
    // event fires for every flow (direct PI, Checkout Session, external),
    // so this is the one canonical place to ping Slack about a new sale.
    //
    // Exception: for dating we defer to checkout.session.completed which
    // posts the *root* of a per-order threaded feed. Doing it here would
    // create a duplicate root without a dating_orders row to attach it to.
    if (meta.funnel !== "dating") {
      const slackEmail = meta.customer_email || "(no email — check Stripe)";
      const slackAmount = (pi.amount ?? 0) / 100;
      const slackCurrency = (pi.currency ?? "usd").toUpperCase();
      const slackUtm = [meta.utm_source, meta.utm_campaign, meta.utm_content].filter(Boolean).join(" · ") || "—";
      void postToSlack("sales", {
        text: [
          `<!channel> :moneybag: *New sale — $${slackAmount.toFixed(2)} ${slackCurrency}*`,
          `Email: \`${slackEmail}\``,
          `Funnel SID: \`${meta.funnel_sid ?? "—"}\``,
          `Attribution: ${slackUtm}`,
          `PI: \`${pi.id}\``,
        ].join("\n"),
      });
    }

    if (capiSource === "checkout_session") {
      // Fully handled by checkout.session.completed — nothing to do here.
      console.log("[webhook/stripe] Skipping PI — owned by checkout session", { piId: pi.id });
    } else {
      // Direct PaymentIntent or external payment: resolve email then fire CAPI.
      let customerEmail = meta.customer_email || null;

      // For external payments (no customer_email in metadata), fall back to the
      // Stripe Customer object so the purchase is never lost.
      if (!customerEmail && stripeCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId);
          if (customer && !("deleted" in customer)) {
            customerEmail = customer.email ?? null;
          }
        } catch (err) {
          console.error("[webhook/stripe] Customer retrieve failed (pi)", { error: String(err), piId: pi.id });
        }
      }

      // Meta CAPI Purchase
      const purchaseEventTime = pi.created ?? Math.floor(Date.now() / 1000);
      try {
        await sendMetaEvent({
          eventName: "Purchase",
          eventTime: purchaseEventTime,
          eventId: pi.id,
          actionSource: "website",
          eventSourceUrl: "https://protocol-club.com/dashboard",
          email: customerEmail,
          fbclid: meta.fbclid || null,
          customData: {
            value: pi.amount / 100,
            currency: (pi.currency ?? "usd").toUpperCase(),
            content_name: "Attractiveness Protocol",
            content_ids: ["f1-attractiveness-protocol"],
            content_type: "product",
            funnel: meta.funnel ?? null,
            ...(meta.utm_source && { utm_source: meta.utm_source }),
            ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
            ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
            ...(meta.utm_content && { utm_content: meta.utm_content }),
            ...(meta.utm_term && { utm_term: meta.utm_term }),
          },
        });
      } catch (err) {
        console.error("[CAPI-FAIL-ALERT] Purchase CAPI failed (pi)", {
          error:    String(err),
          piId:     pi.id,
          email:    customerEmail,
          amount:   pi.amount,
          currency: pi.currency,
          utm_campaign: meta.utm_campaign ?? null,
          utm_content:  meta.utm_content ?? null,
          fbclid:   meta.fbclid ?? null,
        });
      }

      // TikTok Events API Purchase (event_id matches browser pixel for dedup).
      // Customer signals (UA, IP, ttp) were stashed in metadata at PI creation —
      // the webhook is server-to-server so we can't read them from headers.
      try {
        await sendTiktokEvent({
          eventName: "CompletePayment",
          eventTime: purchaseEventTime,
          eventId: pi.id,
          eventSourceUrl: "https://protocol-club.com/dashboard",
          userAgent: meta.customer_user_agent || undefined,
          ipAddress: meta.customer_ip || undefined,
          email: customerEmail,
          externalId: customerEmail || stripeCustomerId,
          ttclid: meta.ttclid || null,
          ttp: meta.customer_ttp || null,
          properties: {
            value: pi.amount / 100,
            currency: (pi.currency ?? "usd").toUpperCase(),
            contents: [{
              content_id: "f1-attractiveness-protocol",
              content_type: "product",
              content_name: "Attractiveness Protocol",
            }],
          },
        });
      } catch (err) {
        console.error("[TIKTOK-FAIL-ALERT] Purchase TikTok API failed (pi)", {
          error:    String(err),
          piId:     pi.id,
          email:    customerEmail,
          amount:   pi.amount,
          currency: pi.currency,
          utm_campaign: meta.utm_campaign ?? null,
          ttclid:   meta.ttclid ?? null,
        });
      }

      // GA4 Measurement Protocol Purchase
      try {
        await sendGA4Purchase({
          transactionId: pi.id,
          value: pi.amount / 100,
          currency: pi.currency ?? "usd",
          eventTime: pi.created ?? Math.floor(Date.now() / 1000),
          clientId: extractGa4ClientId(meta.ga_client_id) ?? undefined,
        });
      } catch (err) {
        console.error("[webhook/stripe] GA4 Purchase failed (pi)", { error: String(err), piId: pi.id });
      }

      if (customerEmail) {
        // Pause the lead nurture sequence regardless of whether a user row exists yet.
        await supabaseAdmin
          .from("leads")
          .update({ nurture_paused_at: new Date().toISOString() })
          .eq("email", customerEmail.toLowerCase());

        try {
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("id, first_name")
            .eq("email", customerEmail.toLowerCase())
            .maybeSingle();

          if (existingUser) {
            await supabaseAdmin
              .from("users")
              .update({
                has_paid: true,
                paid_amount_cents: pi.amount,
                paid_at: new Date().toISOString(),
                rush_delivery: meta.rush_delivery === "true",
                ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
              })
              .eq("id", existingUser.id);

            const firstName = (existingUser as { first_name?: string }).first_name ?? undefined;

            void Promise.allSettled([
              promoteLeadToCustomer(customerEmail, firstName),
              sendPurchaseConfirmationEmail({
                email: customerEmail,
                firstName,
                amount: pi.amount / 100,
                currency: (pi.currency ?? "usd").toUpperCase(),
              }),
            ]);
          } else {
            // New customer — no account yet: create a registration token and send welcome email
            let firstName: string | undefined;

            // Try to pull the name from the Stripe Customer object if available
            if (stripeCustomerId) {
              try {
                const customer = await stripe.customers.retrieve(stripeCustomerId);
                if (customer && !("deleted" in customer) && customer.name) {
                  firstName = customer.name.trim().split(" ")[0];
                }
              } catch {
                // Non-fatal — firstName stays undefined
              }
            }

            const regToken = await createRegistrationToken({
              email: customerEmail,
              firstName,
              stripeCustomerId: stripeCustomerId ?? undefined,
            });

            const registrationUrl = `${SITE_URL}/register?token=${regToken}`;

            void sendWelcomeEmail({
              email: customerEmail,
              firstName,
              registrationUrl,
            }).catch((err) => {
              console.error("[webhook/stripe] Welcome email failed (pi/new user)", {
                error: String(err),
                email: customerEmail,
              });
            });

            console.log("[webhook/stripe] New user via PI — registration token created, welcome email queued", {
              email: customerEmail,
              registrationUrl,
            });
          }
        } catch (err) {
          console.error("[webhook/stripe] User update failed (pi)", { error: String(err), email: customerEmail });
        }
      }
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = (session.metadata ?? {}) as Record<string, string>;

    // Dating upsells ride the same webhook. They must skip the full
    // Purchase flow (CAPI / GA4 / registration email / lead nurture pause
    // / lead → customer promotion) because those already fired on the
    // original $39 payment. Just flip the flag on the order.
    if (meta.upsell_kind === "priority" || meta.upsell_kind === "luxury") {
      if (session.payment_status !== "paid") {
        console.log("[webhook/stripe] Dating upsell not paid — skipping", {
          sessionId: session.id, paymentStatus: session.payment_status,
        });
        return NextResponse.json({ received: true });
      }
      const orderId = meta.dating_order_id;
      const kind = meta.upsell_kind as "priority" | "luxury";
      if (!orderId) {
        console.error("[webhook/stripe] Dating upsell missing dating_order_id metadata", { sessionId: session.id });
        return NextResponse.json({ received: true });
      }
      const piId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
      const nowIso = new Date().toISOString();

      const update = kind === "priority"
        ? { upsell_priority: true,  upsell_priority_paid_at: nowIso, upsell_priority_pi_id: piId }
        : { upsell_luxury:  true,   upsell_luxury_paid_at:   nowIso, upsell_luxury_pi_id:   piId };

      const { data: upsellOrder, error: updErr } = await supabaseAdmin
        .from("dating_orders")
        .update(update)
        .eq("id", orderId)
        .select("id, email, utm_source, utm_campaign, utm_content")
        .maybeSingle();

      if (updErr) {
        console.error("[webhook/stripe] Dating upsell update failed", { error: updErr.message, orderId, kind });
      } else {
        console.log("[webhook/stripe] Dating upsell recorded", { orderId, kind });
      }

      // ── Meta CAPI Purchase for the upsell ─────────────────
      // The upsell is a separate charge, so it gets its own Purchase event with
      // a distinct event_id (the upsell PI) — it won't dedupe against the $39
      // Purchase. This feeds Meta value optimization the extra upsell revenue.
      // Attribution (utm/email) comes from the parent order.
      const upsellValue = typeof session.amount_total === "number" ? session.amount_total / 100 : 20;
      const upsellCurrency = (session.currency ?? "usd").toUpperCase();
      const upsellEmail = session.customer_details?.email ?? upsellOrder?.email ?? null;
      const upsellProduct = kind === "priority"
        ? { name: "Protocol Dating — Priority Delivery", id: "dating-upsell-priority" }
        : { name: "Protocol Dating — Luxury Lifestyle Pack", id: "dating-upsell-luxury" };
      try {
        await sendMetaEvent({
          eventName: "Purchase",
          eventTime: session.created ?? Math.floor(Date.now() / 1000),
          eventId: piId ?? session.id,
          actionSource: "website",
          eventSourceUrl: `${SITE_URL}/dating/success`,
          email: upsellEmail,
          fbclid: meta.fbclid || null,
          customData: {
            value: upsellValue,
            currency: upsellCurrency,
            content_name: upsellProduct.name,
            content_ids: [upsellProduct.id],
            content_type: "product",
            funnel: "dating",
            upsell_kind: kind,
            ...(upsellOrder?.utm_source && { utm_source: upsellOrder.utm_source }),
            ...(upsellOrder?.utm_campaign && { utm_campaign: upsellOrder.utm_campaign }),
            ...(upsellOrder?.utm_content && { utm_content: upsellOrder.utm_content }),
          },
        });
        console.log("[webhook/stripe] Upsell Purchase CAPI sent", { orderId, kind, value: upsellValue });
      } catch (err) {
        console.error("[CAPI-FAIL-ALERT] Upsell Purchase CAPI failed", {
          error: String(err), orderId, kind, email: upsellEmail, value: upsellValue,
          utm_content: upsellOrder?.utm_content ?? null,
        });
      }

      // ── TikTok Events API CompletePayment for the upsell ──
      // Mirror of the Meta upsell event above: own event_id (the upsell PI) so
      // it won't dedupe against the $39 CompletePayment, feeding TikTok the
      // extra upsell revenue. Attribution (ttclid/ttp/email) from the session.
      try {
        await sendTiktokEvent({
          eventName: "CompletePayment",
          eventTime: session.created ?? Math.floor(Date.now() / 1000),
          eventId: piId ?? session.id,
          eventSourceUrl: `${SITE_URL}/dating/success`,
          userAgent: meta.customer_user_agent || undefined,
          ipAddress: meta.customer_ip || undefined,
          email: upsellEmail,
          externalId: upsellEmail || undefined,
          ttclid: meta.ttclid || null,
          ttp: meta.customer_ttp || null,
          properties: {
            value: upsellValue,
            currency: upsellCurrency,
            contents: [{
              content_id: upsellProduct.id,
              content_type: "product",
              content_name: upsellProduct.name,
            }],
          },
        });
        console.log("[webhook/stripe] Upsell CompletePayment TikTok sent", { orderId, kind, value: upsellValue });
      } catch (err) {
        console.error("[TIKTOK-FAIL-ALERT] Upsell CompletePayment failed", {
          error: String(err), orderId, kind, email: upsellEmail, value: upsellValue,
        });
      }

      // Ping #new-sales so the team sees the upsell in the same feed as the
      // parent order. Best-effort — never block the webhook on Slack.
      try {
        await postToSlack("sales", {
          text: kind === "priority"
            ? `:zap: *Priority delivery upsell* — $20 · order \`${orderId.slice(0,8)}\``
            : `:champagne: *Luxury Lifestyle pack upsell* — $20 · order \`${orderId.slice(0,8)}\``,
        });
      } catch { /* best-effort */ }

      return NextResponse.json({ received: true, upsell: kind });
    }

    const customerEmail = session.customer_details?.email ?? null;
    const customerName = session.customer_details?.name ?? null;
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;

    // Extract first name from full name (split on first space)
    const firstName = customerName
      ? customerName.trim().split(" ")[0]
      : undefined;

    console.log("[webhook/stripe] checkout.session.completed", {
      sessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      funnel: meta.funnel,
      utmSource: meta.utm_source,
      email: customerEmail,
    });

    // ── Meta CAPI Purchase ────────────────────────────────
    const sessionPurchaseEventTime = session.created ?? Math.floor(Date.now() / 1000);
    const sessionPurchaseValue = typeof session.amount_total === "number" ? session.amount_total / 100 : 89;
    const sessionPurchaseCurrency = (session.currency ?? "usd").toUpperCase();
    const isDating = meta.funnel === "dating";
    const purchaseProduct = isDating
      ? { name: "Protocol Dating — AI Dating Photos", id: "dating-ai-photos" }
      : { name: "Attractiveness Protocol", id: "f1-attractiveness-protocol" };
    // Use the PI id as the canonical event_id across ALL fire paths (this
    // handler, the payment_intent.succeeded handler, and any manual replay).
    // Same event_id + same event_name = Meta/TikTok dedupe to a single
    // conversion, even if the guard on payment_intent.succeeded slips.
    const purchasePiId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);
    try {
      await sendMetaEvent({
        eventName: "Purchase",
        eventTime: sessionPurchaseEventTime,
        eventId: purchasePiId,
        actionSource: "website",
        eventSourceUrl: "https://protocol-club.com/checkout",
        email: customerEmail,
        fbclid: meta.fbclid || null,
        customData: {
          value: sessionPurchaseValue,
          currency: sessionPurchaseCurrency,
          content_name: purchaseProduct.name,
          content_ids: [purchaseProduct.id],
          content_type: "product",
          funnel: meta.funnel ?? null,
          funnel_type: meta.funnel_type ?? null,
          ...(meta.utm_source && { utm_source: meta.utm_source }),
          ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
          ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
          ...(meta.utm_content && { utm_content: meta.utm_content }),
          ...(meta.utm_term && { utm_term: meta.utm_term }),
        },
      });
      console.log("[webhook/stripe] Purchase CAPI sent", { sessionId: session.id });
    } catch (err) {
      console.error("[CAPI-FAIL-ALERT] Purchase CAPI failed (session)", {
        error:     String(err),
        sessionId: session.id,
        email:     customerEmail,
        amount:    session.amount_total,
        currency:  session.currency,
        utm_campaign: meta.utm_campaign ?? null,
        utm_content:  meta.utm_content ?? null,
        fbclid:    meta.fbclid ?? null,
      });
    }

    // ── TikTok Events API Purchase ────────────────────────
    // Customer signals (UA, IP, ttp) stashed in metadata at session creation.
    // Phone comes from Stripe Checkout phone_number_collection (E.164 format).
    try {
      await sendTiktokEvent({
        eventName: "CompletePayment",
        eventTime: sessionPurchaseEventTime,
        eventId: purchasePiId,
        eventSourceUrl: "https://protocol-club.com/checkout",
        userAgent: meta.customer_user_agent || undefined,
        ipAddress: meta.customer_ip || undefined,
        email: customerEmail,
        phone: session.customer_details?.phone ?? null,
        externalId: customerEmail || stripeCustomerId,
        ttclid: meta.ttclid || null,
        ttp: meta.customer_ttp || null,
        properties: {
          value: sessionPurchaseValue,
          currency: sessionPurchaseCurrency,
          contents: [{
            content_id: purchaseProduct.id,
            content_type: "product",
            content_name: purchaseProduct.name,
          }],
        },
      });
      console.log("[webhook/stripe] Purchase TikTok API sent", { sessionId: session.id });
    } catch (err) {
      console.error("[TIKTOK-FAIL-ALERT] Purchase TikTok API failed (session)", {
        error:     String(err),
        sessionId: session.id,
        email:     customerEmail,
        amount:    session.amount_total,
        currency:  session.currency,
        utm_campaign: meta.utm_campaign ?? null,
        ttclid:    meta.ttclid ?? null,
      });
    }

    // ── GA4 Measurement Protocol Purchase ────────────────────
    try {
      await sendGA4Purchase({
        transactionId: purchasePiId,
        value: typeof session.amount_total === "number" ? session.amount_total / 100 : 89,
        currency: session.currency ?? "usd",
        eventTime: session.created ?? Math.floor(Date.now() / 1000),
        clientId: extractGa4ClientId(meta.ga_client_id) ?? undefined,
      });
    } catch (err) {
      console.error("[webhook/stripe] GA4 Purchase failed", { error: String(err), sessionId: session.id });
    }

    // ── Customer portal: registration token + welcome email ──
    if (customerEmail) {
      // Pause the lead nurture sequence regardless of whether a user row exists yet.
      await supabaseAdmin
        .from("leads")
        .update({ nurture_paused_at: new Date().toISOString() })
        .eq("email", customerEmail.toLowerCase());

      if (isDating) {
        // Protocol Dating order — no Protocol account, no registration email.
        // Async payment methods fire checkout.session.completed with
        // payment_status "unpaid" — don't record or confirm unsettled money
        // (getOrCreateDatingOrder applies the same gate on the success page).
        if (session.payment_status !== "paid") {
          console.log("[webhook/stripe] Dating session completed but not paid — skipping", {
            sessionId: session.id,
            paymentStatus: session.payment_status,
          });
          return NextResponse.json({ received: true });
        }
        try {
          const { data: upsertedOrder, error: orderError } = await supabaseAdmin
            .from("dating_orders")
            .upsert(
              {
                stripe_session_id: session.id,
                email: customerEmail.toLowerCase(),
                first_name: firstName ?? null,
                amount_cents: typeof session.amount_total === "number" ? session.amount_total : 3900,
                utm_source: meta.utm_source ?? null,
                utm_campaign: meta.utm_campaign ?? null,
                utm_content: meta.utm_content ?? null,
              },
              { onConflict: "stripe_session_id" }
            )
            .select("id, slack_sales_thread_ts")
            .single();
          if (orderError) throw new Error(orderError.message);

          // Post the root of the sales feed once per order. Idempotent:
          // if the webhook is redelivered, we skip when a ts already
          // exists. Awaited so Netlify's Lambda freeze doesn't drop the
          // Slack call after the response is sent.
          if (upsertedOrder && !upsertedOrder.slack_sales_thread_ts) {
            const piIdFromSession = typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent?.id ?? null);
            await postDatingOrderRoot({
              orderId: upsertedOrder.id as string,
              stripeSessionId: session.id,
              email: customerEmail,
              firstName: firstName ?? null,
              amountCents: typeof session.amount_total === "number" ? session.amount_total : 3900,
              utmSource: meta.utm_source ?? null,
              utmCampaign: meta.utm_campaign ?? null,
              utmContent: meta.utm_content ?? null,
              piId: piIdFromSession,
            });
          }

          // Awaited: on serverless the runtime can freeze after the response
          // is sent, and this email is the customer's only recovery path to
          // the upload link.
          await sendDatingConfirmationEmail({
            email: customerEmail,
            firstName,
            uploadUrl: `${SITE_URL}/dating/success?session_id=${session.id}`,
          }).catch((err) => {
            console.error("[webhook/stripe] Dating confirmation email failed", {
              error: String(err),
              email: customerEmail,
            });
          });

          console.log("[webhook/stripe] Dating order recorded, confirmation email queued", {
            sessionId: session.id,
            email: customerEmail,
          });
        } catch (err) {
          console.error("[webhook/stripe] Dating order setup failed", {
            error: String(err),
            sessionId: session.id,
          });
        }
        return NextResponse.json({ received: true });
      }

      try {
        // If the user already has an account, mark them as paid
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", customerEmail.toLowerCase())
          .maybeSingle();

        if (existingUser) {
          await supabaseAdmin
            .from("users")
            .update({
              has_paid: true,
              paid_amount_cents: typeof session.amount_total === "number" ? session.amount_total : 8900,
              paid_at: new Date().toISOString(),
              ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
            })
            .eq("id", existingUser.id);

          console.log("[webhook/stripe] Updated existing user has_paid=true", {
            email: customerEmail,
          });

          void Promise.allSettled([
            promoteLeadToCustomer(customerEmail, firstName),
            sendPurchaseConfirmationEmail({
              email: customerEmail,
              firstName,
              amount: typeof session.amount_total === "number" ? session.amount_total / 100 : 89,
              currency: (session.currency ?? "usd").toUpperCase(),
            }),
          ]);
        } else {
          // New customer — create a registration token so they can sign up
          const regToken = await createRegistrationToken({
            email: customerEmail,
            firstName,
            stripeCustomerId: stripeCustomerId ?? undefined,
          });

          const registrationUrl = `${SITE_URL}/register?token=${regToken}`;

          // Fire-and-forget: welcome email via Resend
          void sendWelcomeEmail({
            email: customerEmail,
            firstName,
            registrationUrl,
          }).catch((err) => {
            console.error("[webhook/stripe] Welcome email failed", {
              error: String(err),
              email: customerEmail,
            });
          });

          console.log("[webhook/stripe] Registration token created, welcome email queued", {
            email: customerEmail,
            registrationUrl,
          });
        }
      } catch (err) {
        // Non-fatal — log but don't fail the webhook (Stripe would retry)
        console.error("[webhook/stripe] Portal setup failed", {
          error: String(err),
          email: customerEmail,
          sessionId: session.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

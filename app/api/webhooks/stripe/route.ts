import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";
import { getStripeServerClient } from "../../../../lib/stripe";
import { createRegistrationToken } from "../../../../lib/auth";
import { sendWelcomeEmail, sendPurchaseConfirmationEmail } from "../../../../lib/email";
import { supabaseAdmin } from "../../../../lib/supabase";

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
      try {
        await sendMetaEvent({
          eventName: "Purchase",
          eventTime: pi.created ?? Math.floor(Date.now() / 1000),
          eventId: pi.id,
          actionSource: "website",
          eventSourceUrl: "https://protocol-club.com/dashboard",
          email: customerEmail,
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
            ...(meta.fbclid && { fbclid: meta.fbclid }),
          },
        });
      } catch (err) {
        console.error("[webhook/stripe] Purchase CAPI failed (pi)", { error: String(err), piId: pi.id });
      }

      if (customerEmail) {
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
                ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
              })
              .eq("id", existingUser.id);

            const firstName = (existingUser as { first_name?: string }).first_name ?? undefined;

            void sendPurchaseConfirmationEmail({
              email: customerEmail,
              firstName,
              amount: pi.amount / 100,
              currency: (pi.currency ?? "usd").toUpperCase(),
            }).catch(() => {});
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
    try {
      await sendMetaEvent({
        eventName: "Purchase",
        eventTime: session.created ?? Math.floor(Date.now() / 1000),
        eventId: session.id,
        actionSource: "website",
        eventSourceUrl: "https://protocol-club.com/checkout",
        email: customerEmail,
        customData: {
          value: typeof session.amount_total === "number" ? session.amount_total / 100 : 89,
          currency: (session.currency ?? "usd").toUpperCase(),
          content_name: "Attractiveness Protocol",
          content_ids: ["f1-attractiveness-protocol"],
          content_type: "product",
          funnel: meta.funnel ?? null,
          funnel_type: meta.funnel_type ?? null,
          ...(meta.utm_source && { utm_source: meta.utm_source }),
          ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
          ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
          ...(meta.utm_content && { utm_content: meta.utm_content }),
          ...(meta.utm_term && { utm_term: meta.utm_term }),
          ...(meta.fbclid && { fbclid: meta.fbclid }),
        },
      });
      console.log("[webhook/stripe] Purchase CAPI sent", { sessionId: session.id });
    } catch (err) {
      console.error("[webhook/stripe] Purchase CAPI failed", {
        error: String(err),
        sessionId: session.id,
      });
    }

    // ── Customer portal: registration token + welcome email ──
    if (customerEmail) {
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
              ...(stripeCustomerId && { stripe_customer_id: stripeCustomerId }),
            })
            .eq("id", existingUser.id);

          console.log("[webhook/stripe] Updated existing user has_paid=true", {
            email: customerEmail,
          });

          void sendPurchaseConfirmationEmail({
            email: customerEmail,
            firstName,
            amount: typeof session.amount_total === "number" ? session.amount_total / 100 : 89,
            currency: (session.currency ?? "usd").toUpperCase(),
          }).catch((err) => {
            console.error("[webhook/stripe] Purchase confirmation email failed", { error: String(err), email: customerEmail });
          });
        } else {
          // New customer — create a registration token so they can sign up
          const regToken = await createRegistrationToken({
            email: customerEmail,
            firstName,
            stripeCustomerId: stripeCustomerId ?? undefined,
          });

          const registrationUrl = `${SITE_URL}/register?token=${regToken}`;

          // Fire-and-forget: welcome email via Klaviyo
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

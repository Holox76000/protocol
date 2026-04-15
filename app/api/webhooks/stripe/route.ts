import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";
import { getStripeServerClient } from "../../../../lib/stripe";
import { createRegistrationToken } from "../../../../lib/auth";
import { sendKlaviyoWelcomeEmail, promoteLeadToCustomer, sendKlaviyoPurchaseEvent } from "../../../../lib/klaviyo";
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
    const customerEmail = meta.customer_email || null;
    const stripeCustomerId =
      typeof pi.customer === "string" ? pi.customer : null;

    console.log("[webhook/stripe] payment_intent.succeeded", {
      paymentIntentId: pi.id,
      amount: pi.amount,
      funnel: meta.funnel,
      email: customerEmail,
    });

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

          void Promise.allSettled([
            promoteLeadToCustomer(customerEmail, firstName),
            sendKlaviyoPurchaseEvent(customerEmail, firstName),
          ]).catch(() => {});
        }
      } catch (err) {
        console.error("[webhook/stripe] User update failed (pi)", { error: String(err), email: customerEmail });
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

          // Move from leads → customers and fire purchase event
          void Promise.allSettled([
            promoteLeadToCustomer(customerEmail, firstName),
            sendKlaviyoPurchaseEvent(customerEmail, firstName),
          ]).then(() => {
            console.log("[webhook/stripe] Klaviyo updated for existing user", { email: customerEmail });
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
          void sendKlaviyoWelcomeEmail({
            email: customerEmail,
            firstName,
            registrationUrl,
          }).catch((err) => {
            console.error("[webhook/stripe] Klaviyo welcome email failed", {
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

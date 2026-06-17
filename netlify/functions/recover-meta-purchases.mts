/**
 * Fallback CAPI recovery — runs every 30 min.
 *
 * Re-sends a Meta CAPI Purchase event for every Stripe PaymentIntent that
 * succeeded in the last 24h. Idempotent: event_id = pi.id matches what the
 * webhook would have sent, so Meta deduplicates within its ~7-day window.
 *
 * This guards against silent CAPI failures in the webhook
 * (`[CAPI-FAIL-ALERT]` logs in app/api/webhooks/stripe/route.ts).
 */

import { schedule } from "@netlify/functions";
import Stripe from "stripe";
import { sendMetaEvent } from "../../lib/metaCapi";

const LOOKBACK_HOURS = 24;

const handler = schedule("*/30 * * * *", async () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("[recover-meta-purchases] STRIPE_SECRET_KEY missing");
    return { statusCode: 500 };
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const since = Math.floor(Date.now() / 1000) - LOOKBACK_HOURS * 3600;

  let totalSeen = 0;
  let sent = 0;
  let failed = 0;
  let startingAfter: string | undefined;

  do {
    const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
      created: { gte: since },
      limit:   100,
      ...(startingAfter && { starting_after: startingAfter }),
    });

    for (const pi of page.data) {
      if (pi.status !== "succeeded") continue;
      totalSeen++;

      const meta = (pi.metadata ?? {}) as Record<string, string>;
      const email = meta.customer_email || null;

      try {
        const result = await sendMetaEvent({
          eventName:       "Purchase",
          eventTime:       pi.created,
          eventId:         pi.id,
          actionSource:    "website",
          eventSourceUrl:  "https://protocol-club.com/dashboard",
          email,
          fbclid:          meta.fbclid || null,
          customData: {
            value:        pi.amount / 100,
            currency:     (pi.currency ?? "usd").toUpperCase(),
            content_name: "Attractiveness Protocol",
            content_ids:  ["f1-attractiveness-protocol"],
            content_type: "product",
            funnel:       meta.funnel ?? null,
            ...(meta.utm_source   && { utm_source:   meta.utm_source }),
            ...(meta.utm_medium   && { utm_medium:   meta.utm_medium }),
            ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
            ...(meta.utm_content  && { utm_content:  meta.utm_content }),
            ...(meta.utm_term     && { utm_term:     meta.utm_term }),
          },
        });

        if (result?.ok) sent++;
        else            failed++;
      } catch (err) {
        failed++;
        console.error("[recover-meta-purchases] send threw", { piId: pi.id, error: String(err) });
      }
    }

    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined;
  } while (startingAfter);

  console.log("[recover-meta-purchases] done", {
    lookback_hours: LOOKBACK_HOURS,
    total_seen:     totalSeen,
    sent,
    failed,
  });

  return { statusCode: 200 };
});

export { handler };

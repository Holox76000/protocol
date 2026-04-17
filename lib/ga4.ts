/**
 * GA4 Measurement Protocol — server-side event tracking.
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * Required env vars:
 *   GA4_MEASUREMENT_ID  — e.g. G-XXXXXXXXXX  (Data Streams > Web stream details)
 *   GA4_API_SECRET      — Measurement Protocol API secret (Data Streams > API secrets)
 */

type GA4PurchaseParams = {
  /** Unique transaction ID (use Stripe PaymentIntent or Session ID) */
  transactionId: string;
  /** Amount in the currency's main unit (e.g. 89.00) */
  value: number;
  currency: string;
  /** ISO timestamp as epoch seconds */
  eventTime?: number;
  /** Client ID — use Stripe customer ID or a hash of the email as a proxy */
  clientId?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
};

export async function sendGA4Purchase(params: GA4PurchaseParams): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.warn("[ga4] Missing GA4_MEASUREMENT_ID or GA4_API_SECRET — skipping");
    return;
  }

  // GA4 requires a client_id; for server-side events without a browser cookie
  // we use the Stripe customer ID or a stable placeholder.
  const clientId = params.clientId ?? "server-side";

  const payload = {
    client_id: clientId,
    // timestamp_micros lets GA4 attribute the event to the correct time
    timestamp_micros: String((params.eventTime ?? Math.floor(Date.now() / 1000)) * 1_000_000),
    non_personalized_ads: false,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: params.transactionId,
          value: params.value,
          currency: params.currency.toUpperCase(),
          items: params.items ?? [
            {
              item_id: "f1-attractiveness-protocol",
              item_name: "Attractiveness Protocol",
              price: params.value,
              quantity: 1,
            },
          ],
        },
      },
    ],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // GA4 MP returns 204 on success (no body)
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      console.error("[ga4] Purchase event failed", { status: res.status, body: text, transactionId: params.transactionId });
    } else {
      console.log("[ga4] Purchase event sent", { transactionId: params.transactionId, value: params.value, currency: params.currency });
    }
  } catch (err) {
    console.error("[ga4] Purchase event error", { error: String(err), transactionId: params.transactionId });
  }
}

/**
 * GA4 Measurement Protocol — server-side event tracking.
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * Required env vars:
 *   GA4_MEASUREMENT_ID  — e.g. G-XXXXXXXXXX  (Data Streams > Web stream details)
 *   GA4_API_SECRET      — Measurement Protocol API secret (Data Streams > API secrets)
 */

/** Extract the GA4 client_id from the raw value of the _ga cookie. */
export function extractGa4ClientId(gaCookie: string | null | undefined): string | null {
  if (!gaCookie) return null;
  // Format: GA1.1.<client_id_part1>.<client_id_part2>
  const parts = gaCookie.split(".");
  if (parts.length >= 4) return parts.slice(2).join(".");
  return null;
}

function isLocal() {
  return process.env.NODE_ENV !== "production";
}

type SendOptions = {
  userId?: string;
  ipOverride?: string;
  userAgent?: string;
};

async function sendToGA4MP(
  clientId: string,
  eventName: string,
  eventParams: Record<string, unknown>,
  eventTime?: number,
  options?: SendOptions,
): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (isLocal()) {
    console.log("[ga4] dev — skipping", eventName, eventParams);
    return;
  }

  if (!measurementId || !apiSecret) {
    console.warn("[ga4] Missing GA4_MEASUREMENT_ID or GA4_API_SECRET — skipping");
    return;
  }

  const payload: Record<string, unknown> = {
    client_id: clientId,
    timestamp_micros: String((eventTime ?? Math.floor(Date.now() / 1000)) * 1_000_000),
    non_personalized_ads: false,
    events: [{
      name: eventName,
      params: {
        engagement_time_msec: 1,
        ...eventParams,
      },
    }],
    ...(options?.userId && { user_id: options.userId }),
    ...(options?.ipOverride && { ip_override: options.ipOverride }),
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.userAgent) headers["User-Agent"] = options.userAgent;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      console.error("[ga4] Event failed", { eventName, status: res.status, body: text });
    } else {
      console.log("[ga4] Event sent", { eventName, clientId, userId: options?.userId });
    }
  } catch (err) {
    console.error("[ga4] Event error", { eventName, error: String(err) });
  }
}

// ─── Generic event ────────────────────────────────────────────────────────────

type GA4EventParams = {
  eventName: string;
  params?: Record<string, unknown>;
  clientId?: string;
  /** epoch seconds */
  eventTime?: number;
  userId?: string;
  ipOverride?: string;
  userAgent?: string;
};

export async function sendGA4Event({
  eventName,
  params = {},
  clientId,
  eventTime,
  userId,
  ipOverride,
  userAgent,
}: GA4EventParams): Promise<void> {
  await sendToGA4MP(clientId ?? "server-side", eventName, params, eventTime, { userId, ipOverride, userAgent });
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

type GA4PurchaseParams = {
  /** Unique transaction ID (use Stripe PaymentIntent or Session ID) */
  transactionId: string;
  /** Amount in the currency's main unit (e.g. 89.00) */
  value: number;
  currency: string;
  /** epoch seconds */
  eventTime?: number;
  /** GA4 client_id extracted from the _ga cookie */
  clientId?: string;
  /** Supabase user UUID for cross-device tracking */
  userId?: string;
  /** GA4 session_id from the browser session */
  sessionId?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
};

export async function sendGA4Purchase(params: GA4PurchaseParams): Promise<void> {
  const eventParams: Record<string, unknown> = {
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
    ...(params.sessionId && { session_id: params.sessionId }),
  };

  await sendToGA4MP(
    params.clientId ?? "server-side",
    "purchase",
    eventParams,
    params.eventTime,
    { userId: params.userId },
  );
}

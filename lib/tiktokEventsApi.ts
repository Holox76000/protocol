import { createHash } from "crypto";

// TikTok Events API v1.3
// https://business-api.tiktok.com/portal/docs?id=1771101303285761
//
// Mirrors lib/metaCapi.ts. Same call sites fire both in parallel for
// cross-platform coverage. event_id matches the browser pixel for dedup
// (Stripe session.id for InitiateCheckout / Purchase, etc).

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
const DEFAULT_PIXEL_ID = "D9OSILJC77U7RKPO8F3G";

type TiktokContent = {
  content_id: string;
  content_type: "product" | "product_group";
  content_name: string;
};

type TiktokProperties = {
  value?: number;
  currency?: string;
  contents?: TiktokContent[];
  description?: string;
};

type TiktokEvent = {
  eventName:
    | "ViewContent"
    | "AddPaymentInfo"
    | "InitiateCheckout"
    | "PlaceAnOrder"
    | "CompleteRegistration"
    | "CompletePayment";
  eventTime: number; // unix seconds
  eventId: string;
  eventSourceUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  email?: string | null;
  phone?: string | null; // E.164 format ("+33612345678"), hashed here
  externalId?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
  properties?: TiktokProperties;
};

function normalizePhoneE164(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  // Strip every non-digit except a leading + (E.164 requires +<countrycode><number>).
  const digits = trimmed.replace(/(?!^\+)[^\d]/g, "");
  if (!digits.startsWith("+") || digits.length < 8) return null;
  return digits;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function sendTiktokEvent(event: TiktokEvent) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const pixelId = process.env.TIKTOK_PIXEL_ID ?? DEFAULT_PIXEL_ID;

  if (!accessToken) {
    console.warn("[tiktok] sendTiktokEvent skipped — TIKTOK_ACCESS_TOKEN not set");
    return { ok: false, status: 0, body: "TIKTOK_ACCESS_TOKEN not set" };
  }

  const user: Record<string, string> = {};
  if (event.email) {
    const normalized = normalizeEmail(event.email);
    if (normalized) user.email = sha256(normalized);
  }
  if (event.phone) {
    const normalized = normalizePhoneE164(event.phone);
    if (normalized) user.phone = sha256(normalized);
  }
  if (event.externalId) user.external_id = sha256(event.externalId);
  if (event.userAgent) user.user_agent = event.userAgent;
  if (event.ipAddress) user.ip = event.ipAddress;
  if (event.ttclid) user.ttclid = event.ttclid;
  if (event.ttp) user.ttp = event.ttp;

  const body = {
    event_source: "web",
    event_source_id: pixelId,
    ...(process.env.TIKTOK_TEST_EVENT_CODE && {
      test_event_code: process.env.TIKTOK_TEST_EVENT_CODE,
    }),
    data: [
      {
        event: event.eventName,
        event_time: event.eventTime,
        event_id: event.eventId,
        user,
        ...(event.properties && { properties: event.properties }),
        ...(event.eventSourceUrl && { page: { url: event.eventSourceUrl } }),
      },
    ],
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    // TikTok returns HTTP 200 with {code: <non-zero>, message: "..."} on errors,
    // so we can't rely on response.ok alone.
    let code: number | undefined;
    try {
      code = (JSON.parse(text) as { code?: number }).code;
    } catch {
      // Non-JSON response — keep code undefined.
    }

    if (!response.ok || (typeof code === "number" && code !== 0)) {
      console.error("[tiktok] failed", { status: response.status, body: text });
      return { ok: false, status: response.status, body: text };
    }
    return { ok: true, status: response.status, body: text };
  } catch (error) {
    console.error("[tiktok] error", error);
    return { ok: false, status: 0, body: String(error) };
  }
}

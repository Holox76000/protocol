import { createHash } from "crypto";

type MetaEvent = {
  eventName: string;
  eventTime: number;
  eventId: string;
  actionSource: "website" | "other";
  eventSourceUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  email?: string | null;
  customData?: Record<string, unknown>;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function sendMetaEvent(event: MetaEvent) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;

  if (!accessToken || !pixelId) return;

  const userData: Record<string, string> = {};
  if (event.email) {
    const normalizedEmail = event.email.trim().toLowerCase();
    if (normalizedEmail) {
      userData.em = sha256(normalizedEmail);
    }
  }
  if (event.userAgent) userData.client_user_agent = event.userAgent;
  if (event.ipAddress) userData.client_ip_address = event.ipAddress;

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        event_id: event.eventId,
        action_source: event.actionSource,
        event_source_url: event.eventSourceUrl,
        user_data: userData,
        custom_data: event.customData
      }
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE ?? undefined,
    access_token: accessToken
  };
  console.log("[meta] payload", {
    eventName: event.eventName,
    eventId: event.eventId,
    actionSource: event.actionSource,
    hasTestCode: Boolean(process.env.META_TEST_EVENT_CODE)
  });

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("[meta] failed", response.status, text);
      return { ok: false, status: response.status, body: text };
    }
    console.log("[meta] ok", text);
    return { ok: true, status: response.status, body: text };
  } catch (error) {
    console.error("[meta] error", error);
    return { ok: false, status: 0, body: String(error) };
  }
}

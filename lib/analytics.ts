type EventPayload = Record<string, unknown>;

type EventName =
  | "quiz_started"
  | "question_answered"
  | "optin_viewed"
  | "lead_submitted"
  | "result_viewed"
  | "cta_clicked"
  | "program_landing_viewed"
  | "program_cta_clicked"
  | "view_offer";

const SESSION_KEY = "sf_quiz_session_id";

type FbqFunction = (
  command: "track" | "trackCustom",
  eventName: string,
  payload?: EventPayload,
  options?: { eventID?: string }
) => void;

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const fresh = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(SESSION_KEY, fresh);
  return fresh;
}

export function trackEvent(name: EventName, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  const eventId = `${sessionId}:${name}:${Date.now()}`;

  const fbq = (window as Window & { fbq?: FbqFunction }).fbq;

  if (name === "view_offer") {
    try {
      fbq?.("track", "ViewContent", {
        content_name: "F1 Offer",
        content_ids: ["f1-attractiveness-protocol"],
        content_type: "product",
        value: 89,
        currency: "USD",
      }, { eventID: eventId });
    } catch {
      // Ignore Meta Pixel runtime issues in the UI flow.
    }
  }

  if (name === "cta_clicked") {
    try {
      fbq?.("trackCustom", "Vue de page de paiement", payload, { eventID: eventId });
    } catch {
      // Ignore Meta Pixel runtime issues in the UI flow.
    }
  }

  console.log(`[event] ${name}`, payload);

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      sessionId,
      event: name,
      eventId,
      step: typeof payload.step === "number" ? payload.step : undefined,
      payload,
      createdAt: new Date().toISOString()
    })
  }).catch(() => {
    // Ignore tracking errors in the UI flow.
  });
}

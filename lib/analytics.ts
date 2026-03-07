type EventPayload = Record<string, unknown>;

type EventName =
  | "quiz_started"
  | "question_answered"
  | "optin_viewed"
  | "lead_submitted"
  | "result_viewed"
  | "cta_clicked";

const SESSION_KEY = "sf_quiz_session_id";

type FbqFunction = (
  command: "trackCustom",
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

  if (name === "cta_clicked") {
    const fbq = (window as Window & { fbq?: FbqFunction }).fbq;
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

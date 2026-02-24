type EventPayload = Record<string, unknown>;

type EventName =
  | "quiz_started"
  | "question_answered"
  | "optin_viewed"
  | "lead_submitted"
  | "result_viewed"
  | "cta_clicked";

export function trackEvent(name: EventName, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;
  // Placeholder for future analytics wiring.
  console.log(`[event] ${name}`, payload);
}

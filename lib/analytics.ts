type EventPayload = Record<string, unknown>;

type EventName =
  | "quiz_started"
  | "question_answered"
  | "optin_viewed"
  | "lead_submitted"
  | "result_viewed"
  | "cta_clicked";

const SESSION_KEY = "sf_quiz_session_id";

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
  // Placeholder for future analytics wiring.
  console.log(`[event] ${name}`, payload);

  const callFbq = (args: unknown[], retries = 3) => {
    const fbq = (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === "function") {
      fbq(...args);
      return;
    }
    if (retries > 0) {
      window.setTimeout(() => callFbq(args, retries - 1), 250);
    }
  };

  if (name === "quiz_started") {
    callFbq(["trackCustom", "StartQuiz"]);
  }
  if (name === "lead_submitted") {
    callFbq(["track", "Lead"]);
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getSessionId(),
      event: name,
      step: typeof payload.step === "number" ? payload.step : undefined,
      payload,
      createdAt: new Date().toISOString()
    })
  }).catch(() => {
    // Ignore tracking errors in the UI flow.
  });
}

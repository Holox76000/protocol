import { SIGNUP_STORAGE_KEY, STORAGE_KEY } from "./woman-quiz-data";

export async function persistWomanQuizLead(
  extraAnswers?: Record<string, string>,
  options?: { source?: string; segment?: string },
) {
  try {
    const signupRaw = window.localStorage.getItem(SIGNUP_STORAGE_KEY);
    const quizRaw = window.localStorage.getItem(STORAGE_KEY);
    const signup = signupRaw ? (JSON.parse(signupRaw) as Record<string, string>) : null;
    const quizAnswers = quizRaw ? (JSON.parse(quizRaw) as Record<string, string>) : null;

    if (!signup?.email) return;

    await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "merge",
        email: signup.email,
        answers: {
          ...signup,
          ...(quizAnswers ?? {}),
          ...(extraAnswers ?? {}),
          funnel: "woman",
          source: options?.source ?? "woman_quiz_progress",
        },
        segment: options?.segment ?? "woman_quiz_progress",
        completedAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("[woman-quiz] failed to persist quiz progress", error);
  }
}

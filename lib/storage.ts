import type { AnswerMap } from "./scoring";
import type { UtmParams } from "./utm";

export type QuizState = {
  step: number;
  answers: AnswerMap;
  email?: string;
  startedAt?: string;
  utm?: UtmParams;
};

const STORAGE_KEY = "sf_quiz_state";

export function loadQuizState(): QuizState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as QuizState;
  } catch {
    return null;
  }
}

export function saveQuizState(state: QuizState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearQuizState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

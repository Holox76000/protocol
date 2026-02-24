import { quizQuestions, QUIZ_MAX_SCORE } from "./quizConfig";

export type AnswerMap = Record<string, string | undefined>;

export type Segment =
  | "Skinny-Fat Trap (High likelihood)"
  | "Undertrained Beginner"
  | "Not Skinny-Fat / Less likely";

export type PrimaryBlocker =
  | "Cardio Overload"
  | "No Progressive Overload / Program Hopping"
  | "Nutrition Miscalibration"
  | "None";

export type ScoringResult = {
  score: number;
  segment: Segment;
  blocker: PrimaryBlocker;
};

export function calculateScore(answers: AnswerMap): number {
  const raw = quizQuestions.reduce((total, question) => {
    const answerId = answers[question.id];
    const option = question.options.find((entry) => entry.id === answerId);
    return total + (option?.score ?? 0);
  }, 0);

  const normalized = Math.round((raw / QUIZ_MAX_SCORE) * 100);
  return Math.min(100, Math.max(0, normalized));
}

export function getPrimaryBlocker(answers: AnswerMap): PrimaryBlocker {
  const q5 = answers.q5;
  const q6 = answers.q6;
  const q7 = answers.q7;

  const cardioOverload = q5 === "q5_c" || q5 === "q5_d";
  const noOverload = q6 === "q6_c" || q6 === "q6_d";
  const nutritionMiscalibration = q7 === "q7_b" || q7 === "q7_c" || q7 === "q7_d";

  // Priority order: training adherence > nutrition calibration > cardio volume.
  if (noOverload) return "No Progressive Overload / Program Hopping";
  if (nutritionMiscalibration) return "Nutrition Miscalibration";
  if (cardioOverload) return "Cardio Overload";
  return "None";
}

export function getSegment(answers: AnswerMap, score: number): Segment {
  const q1 = answers.q1;

  if (q1 === "q1_d") {
    return "Undertrained Beginner";
  }

  if (score >= 60) {
    return "Skinny-Fat Trap (High likelihood)";
  }

  if (q1 === "q1_c" && score >= 45) {
    return "Undertrained Beginner";
  }

  return "Not Skinny-Fat / Less likely";
}

export function getScoringResult(answers: AnswerMap): ScoringResult {
  const score = calculateScore(answers);
  const segment = getSegment(answers, score);
  const blocker = getPrimaryBlocker(answers);

  return { score, segment, blocker };
}

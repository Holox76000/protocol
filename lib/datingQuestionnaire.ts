// Single source of truth for the dating onboarding questionnaire.
// Shared by /demo (marketing preview) and /dating/success (real flow).
//
// Each question has a stable `id` so the answers persist in DB as a
// keyed record { [id]: option } — this decouples storage from wording,
// so we can iterate on question copy without invalidating past answers.

export type DatingQuestion = {
  id: string;
  q: string;
  options: string[];
};

export type DatingAnswers = Record<string, string>;

export const DATING_QUESTIONS: DatingQuestion[] = [
  {
    id: "style",
    q: "How would you describe your style?",
    options: ["Clean & classic", "Casual", "Streetwear", "Rugged"],
  },
  {
    id: "setting",
    q: "Where do you feel most yourself?",
    options: ["At home", "Outdoors", "At the gym", "Out at night"],
  },
  {
    id: "weekend",
    q: "What does a good weekend look like?",
    options: ["Training", "Cooking with friends", "A hike out of town", "Going out"],
  },
  {
    id: "facial_hair",
    q: "Beard or clean-shaven?",
    options: ["Beard", "Stubble", "Clean-shaven"],
  },
  {
    id: "intent",
    q: "What are you hoping for?",
    options: ["A relationship", "Dates", "Not sure yet"],
  },
  {
    id: "vibe",
    q: "Pick your vibe.",
    options: ["Warm & approachable", "Confident & sharp", "Laid-back"],
  },
];

// Fully answered = every question id has a value. Anything missing = not done.
export function isQuestionnaireComplete(answers: DatingAnswers | null | undefined): boolean {
  if (!answers) return false;
  return DATING_QUESTIONS.every((q) => typeof answers[q.id] === "string" && answers[q.id].length > 0);
}

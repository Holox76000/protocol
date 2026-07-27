// Single source of truth for the dating onboarding questionnaire.
// Shared by /demo (marketing preview) and /dating/success (real flow).
//
// Every question has:
//   - a stable `id` so answers persist in DB as { [id]: text } — decoupled
//     from the question wording so we can iterate copy without invalidating
//     past answers.
//   - a `placeholder` shown inside the input to guide the customer toward
//     the shape of answer we're hoping for.

export type DatingQuestion = {
  id: string;
  q: string;
  placeholder: string;
};

export type DatingAnswers = Record<string, string>;

export const DATING_QUESTIONS: DatingQuestion[] = [
  {
    id: "style",
    q: "How would you describe your style?",
    placeholder: "e.g. Fitted basics, mostly neutrals, no logos, occasional black leather jacket.",
  },
  {
    id: "hobby",
    q: "What's a hobby that says a lot about you?",
    placeholder: "e.g. Bouldering every Wednesday and Saturday morning at the local gym.",
  },
  {
    id: "weekend",
    q: "What does a good weekend look like?",
    placeholder: "e.g. Long brunch with friends, a hike out of town in the afternoon, drinks at a wine bar.",
  },
  {
    id: "setting",
    q: "Where do you feel most yourself?",
    placeholder: "e.g. Outdoors, especially near water, or in a quiet café with a book.",
  },
  {
    id: "vibe",
    q: "What vibe do you want to give off?",
    placeholder: "e.g. Approachable, quietly confident, a bit playful.",
  },
  {
    id: "orientation",
    q: "What's your sexual orientation?",
    placeholder: "e.g. Straight, gay, bi, pansexual, queer...",
  },
  {
    id: "platforms",
    q: "Which dating apps do you use?",
    placeholder: "e.g. Hinge and Bumble. Sometimes Tinder.",
  },
  {
    id: "intent",
    q: "What are you hoping for on those apps?",
    placeholder: "e.g. A serious relationship, or just meeting interesting people first.",
  },
];

// Fully answered = every question id has a non-empty value.
export function isQuestionnaireComplete(answers: DatingAnswers | null | undefined): boolean {
  if (!answers) return false;
  return DATING_QUESTIONS.every((q) => typeof answers[q.id] === "string" && answers[q.id].trim().length > 0);
}

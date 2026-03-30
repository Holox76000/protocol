export type Question = {
  id: string;
  eyebrow: string;
  question: string;
  helper: string;
  options: string[];
};

export const QUESTIONS: Question[] = [
  {
    id: "goal",
    eyebrow: "Question 1",
    question: "What is the main outcome you want from Protocol?",
    helper: "Pick the result you care about most right now.",
    options: ["Lose the skinny-fat look", "Build a more athletic body", "Look better shirtless", "Feel more confident"],
  },
  {
    id: "timeline",
    eyebrow: "Question 2",
    question: "How soon do you want to see visible change?",
    helper: "This helps us understand urgency and expectations.",
    options: ["Within 4 weeks", "Within 8 weeks", "Within 12 weeks", "I care more about sustainability"],
  },
  {
    id: "training",
    eyebrow: "Question 3",
    question: "What best describes your training experience?",
    helper: "Choose the closest fit, even if it is not perfect.",
    options: ["Beginner", "On and off for years", "Consistent intermediate", "Advanced but stuck"],
  },
  {
    id: "body_type",
    eyebrow: "Question 4",
    question: "Where do you feel your body is holding you back most?",
    helper: "Your answer helps us tailor the plan framing.",
    options: ["Belly and waist", "Chest and shoulders", "Arms and upper body", "Overall proportions"],
  },
  {
    id: "diet",
    eyebrow: "Question 5",
    question: "How would you describe your nutrition right now?",
    helper: "Be honest. We are looking for your current baseline.",
    options: ["I mostly guess", "I eat well but inconsistently", "I track sometimes", "I am already disciplined"],
  },
  {
    id: "consistency",
    eyebrow: "Question 6",
    question: "What is your biggest obstacle to consistency?",
    helper: "We want to understand the friction, not the ideal.",
    options: ["Lack of clarity", "Lack of time", "Lack of motivation", "Plateau / no visible results"],
  },
  {
    id: "confidence",
    eyebrow: "Question 7",
    question: "How much is your current physique affecting confidence?",
    helper: "This helps us understand the emotional weight behind the goal.",
    options: ["A little", "Moderately", "A lot", "It is one of my main frustrations"],
  },
  {
    id: "commitment",
    eyebrow: "Question 8",
    question: "How ready are you to follow a structured protocol?",
    helper: "We are measuring commitment, not perfection.",
    options: ["Just exploring", "Open but cautious", "Ready to commit", "I want the clearest plan possible"],
  },
  {
    id: "support",
    eyebrow: "Question 9",
    question: "What kind of support would help you most?",
    helper: "Choose the thing that would make follow-through easiest.",
    options: ["A clear plan", "Visual targets", "Step-by-step accountability", "Science-backed explanations"],
  },
  {
    id: "why_now",
    eyebrow: "Question 10",
    question: "Why are you taking action now?",
    helper: "End with the reason that matters most to you.",
    options: ["Summer / travel", "Dating / confidence", "Career / presence", "I am tired of staying stuck"],
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

export function getV3QuestionStepHref(step: number) {
  return `/v3/questions/${step}`;
}

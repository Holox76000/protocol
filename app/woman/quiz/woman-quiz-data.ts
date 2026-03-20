export const STORAGE_KEY = "protocol.woman.quiz";
export const SIGNUP_STORAGE_KEY = "protocol.woman.signup";

export type WomanQuizQuestion = {
  id: string;
  question: string;
  helper: string;
  options: string[];
  image?: "body-types";
  insights?: Record<string, string>;
};

export type WomanQuizScreen =
  | {
      kind: "question";
      questionIndex: number;
    }
  | {
      kind: "insight";
      questionIndex: number;
    }
  | {
      kind: "final";
    };

export const WOMAN_QUIZ_QUESTIONS: WomanQuizQuestion[] = [
  {
    id: "age_range",
    question: "What is your age range?",
    helper: "This helps us adapt the recommendations to your current body context and likely response profile.",
    options: ["18-24", "25-34", "35-44", "45-54", "55+"],
  },
  {
    id: "body_type",
    question: "What's your body type?",
    helper:
      "Choose the shape that feels closest to you right now. It does not need to be perfect. We just want the best starting point for your plan.",
    image: "body-types",
    options: ["Morpho A", "Morpho 8", "Morpho X", "Morpho V", "Morpho H", "Morpho O"],
  },
  {
    id: "main_goal",
    question: "What would you like to change the most about your body right now?",
    helper: "Pick the result that feels most important emotionally and visually.",
    options: [
      "Lose belly fat",
      "Tone my body",
      "Get a flatter stomach",
      "Feel more confident in clothes",
      "Look more defined",
    ],
    insights: {
      "Lose belly fat":
        "Belly fat is often the most stubborn area, not because you're doing something wrong, but because your body stores fat there first and loses it last.",
      "Tone my body":
        "Most women don't need to lose weight. They need to change how their body is structured, which comes from the right type of training and nutrition.",
      "Get a flatter stomach":
        "A flatter stomach is usually less about ab workouts and more about reducing overall fat while keeping muscle.",
      "Feel more confident in clothes":
        "Confidence often comes from small visible changes, especially around posture, waistline, and overall tone.",
      "Look more defined":
        "Definition doesn't come from doing more. It comes from doing the right things consistently.",
    },
  },
  {
    id: "biggest_pain_point",
    question: "What bothers you the most when you look at your body?",
    helper: "This helps us understand where the discomfort feels most present for you.",
    options: ["Stomach area", "Arms", "Thighs", "Overall softness", "Lack of definition"],
    insights: {
      "Stomach area":
        "The stomach area is highly sensitive to lifestyle and hormonal factors, which is why generic plans often don't work.",
      Arms: "Arm softness is one of the most common concerns, and one of the quickest to improve with the right approach.",
      Thighs:
        "Lower-body fat is often more resistant, but also very responsive once the right strategy is applied.",
      "Overall softness":
        "A soft look usually means your body lacks muscle stimulus, not that you need extreme dieting.",
      "Lack of definition":
        "Definition is less about effort and more about balance between fat loss and muscle tone.",
    },
  },
  {
    id: "past_attempts",
    question: "Have you tried to improve your body before?",
    helper: "We want to understand your history, not judge it.",
    options: ["Yes, but nothing worked", "Yes, but I didn't stick to it", "A little", "Not really"],
    insights: {
      "Yes, but nothing worked":
        "When nothing seems to work, it's rarely about effort. It's usually about following plans that aren't adapted to you.",
      "Yes, but I didn't stick to it":
        "Most plans fail because they're too restrictive, not because you lack discipline.",
      "A little":
        "Even small attempts show your body is ready to change. It just needs the right direction.",
      "Not really":
        "Starting fresh is often an advantage. No bad habits to unlearn, just a clear path forward.",
    },
  },
  {
    id: "current_body_feeling",
    question: "How would you describe your current body?",
    helper: "Choose the answer that feels closest to your current reality.",
    options: ["Skinny but not toned", "Average", "Slightly overweight", "I don't feel comfortable with it"],
    insights: {
      "Skinny but not toned":
        "This is one of the most misunderstood body types, often called skinny fat, and highly responsive to the right plan.",
      Average: "An average body can transform quickly because it's already close to where you want to be.",
      "Slightly overweight":
        "Small fat loss combined with tone can create very visible changes in a short time.",
      "I don't feel comfortable with it":
        "Feeling uncomfortable is often the first sign your body is ready for change, not something to ignore.",
    },
  },
  {
    id: "timeline",
    question: "When would you like to see real changes?",
    helper: "This helps us understand urgency and expectation level.",
    options: ["As soon as possible", "In the next few weeks", "No rush, but I want results", "Just exploring"],
    insights: {
      "As soon as possible":
        "Fast results are possible when your plan matches how your body actually works.",
      "In the next few weeks":
        "A few weeks is enough to see visible changes, especially in tone and posture.",
      "No rush, but I want results":
        "Sustainable results often come from simple, consistent adjustments, not extreme changes.",
      "Just exploring":
        "Exploring is often how real change starts. Understanding your body is the first step.",
    },
  },
  {
    id: "commitment",
    question: "How serious are you about changing your body?",
    helper: "Be honest. We are measuring commitment, not perfection.",
    options: ["I'm ready to commit", "I want to try something new", "I'm curious", "Not sure yet"],
    insights: {
      "I'm ready to commit":
        "Commitment is the biggest predictor of visible transformation. You already have the most important part.",
      "I want to try something new":
        "Trying a new approach is often what unlocks results when everything else has failed.",
      "I'm curious": "Curiosity is often the starting point of lasting change.",
      "Not sure yet":
        "Not being sure is normal. Most people only decide once they see what's possible for them.",
    },
  },
  {
    id: "main_barrier",
    question: "What has been your biggest challenge so far?",
    helper: "This tells us what usually breaks momentum for you.",
    options: ["Lack of results", "Lack of motivation", "Not knowing what to do", "No time"],
    insights: {
      "Lack of results":
        "Lack of results usually comes from doing things that don't match your body, not from lack of effort.",
      "Lack of motivation":
        "Motivation becomes easier when you start seeing progress, even small ones.",
      "Not knowing what to do":
        "Clarity is often the missing piece. Once you know what works, everything becomes simpler.",
      "No time": "Most effective routines don't require more time, just better structure.",
    },
  },
];

export const WOMAN_QUIZ_SCREENS: WomanQuizScreen[] = [
  { kind: "question", questionIndex: 0 },
  { kind: "question", questionIndex: 1 },
  { kind: "question", questionIndex: 2 },
  { kind: "insight", questionIndex: 2 },
  { kind: "question", questionIndex: 3 },
  { kind: "insight", questionIndex: 3 },
  { kind: "question", questionIndex: 4 },
  { kind: "insight", questionIndex: 4 },
  { kind: "question", questionIndex: 5 },
  { kind: "insight", questionIndex: 5 },
  { kind: "question", questionIndex: 6 },
  { kind: "insight", questionIndex: 6 },
  { kind: "question", questionIndex: 7 },
  { kind: "insight", questionIndex: 7 },
  { kind: "final" },
];

export function getWomanQuizScreen(step: number): WomanQuizScreen | null {
  return WOMAN_QUIZ_SCREENS[step - 1] ?? null;
}

export function getWomanQuizStepCount() {
  return WOMAN_QUIZ_SCREENS.length;
}

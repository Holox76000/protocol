export type QuestionOption = {
  id: string;
  label: string;
  score: number;
};

export type Question = {
  id: string;
  title: string;
  options: QuestionOption[];
};

export const quizQuestions: Question[] = [
  {
    id: "q1",
    title: "Do you currently lift weights?",
    options: [
      { id: "q1_a", label: "Yes, 3+ times per week", score: 0 },
      { id: "q1_b", label: "Yes, but inconsistently", score: 8 },
      { id: "q1_c", label: "Rarely", score: 16 },
      { id: "q1_d", label: "Not at all", score: 20 }
    ]
  },
  {
    id: "q2",
    title: "When you cut calories, what happens?",
    options: [
      { id: "q2_a", label: "I just look smaller and flat", score: 14 },
      { id: "q2_b", label: "I lose strength quickly", score: 10 },
      { id: "q2_c", label: "I actually get leaner", score: 0 },
      { id: "q2_d", label: "I’ve never cut", score: 6 }
    ]
  },
  {
    id: "q3",
    title: "When you try to bulk, what happens?",
    options: [
      { id: "q3_a", label: "I mostly gain belly fat", score: 16 },
      { id: "q3_b", label: "I grow everywhere", score: 0 },
      { id: "q3_c", label: "I feel bloated", score: 8 },
      { id: "q3_d", label: "I don’t bulk", score: 6 }
    ]
  },
  {
    id: "q4",
    title: "How do you feel shirtless?",
    options: [
      { id: "q4_a", label: "Confident", score: 0 },
      { id: "q4_b", label: "Neutral", score: 6 },
      { id: "q4_c", label: "Uncomfortable", score: 12 },
      { id: "q4_d", label: "I avoid it", score: 16 }
    ]
  },
  {
    id: "q5",
    title: "How often do you do cardio or HIIT?",
    options: [
      { id: "q5_a", label: "Rarely", score: 0 },
      { id: "q5_b", label: "1–2x per week", score: 4 },
      { id: "q5_c", label: "3–4x per week", score: 10 },
      { id: "q5_d", label: "5+ times / intense HIIT", score: 14 }
    ]
  },
  {
    id: "q6",
    title: "Do you track progressive overload (increasing weights weekly)?",
    options: [
      { id: "q6_a", label: "Yes, consistently", score: 0 },
      { id: "q6_b", label: "Sometimes", score: 8 },
      { id: "q6_c", label: "Not really", score: 14 },
      { id: "q6_d", label: "I change programs often", score: 16 }
    ]
  },
  {
    id: "q7",
    title: "How do you manage nutrition?",
    options: [
      { id: "q7_a", label: "I track calories precisely", score: 0 },
      { id: "q7_b", label: "I try to eat “healthy”", score: 10 },
      { id: "q7_c", label: "I eat intuitively", score: 12 },
      { id: "q7_d", label: "I do strict phases then fall off", score: 14 }
    ]
  },
  {
    id: "q8",
    title: "Do you feel stuck between cutting and bulking?",
    options: [
      { id: "q8_a", label: "Constantly", score: 14 },
      { id: "q8_b", label: "Sometimes", score: 8 },
      { id: "q8_c", label: "Not really", score: 0 }
    ]
  },
  {
    id: "q9",
    title: "Have you ever avoided a situation (beach, pool, intimacy) because of your physique?",
    options: [
      { id: "q9_a", label: "Yes", score: 12 },
      { id: "q9_b", label: "No", score: 0 }
    ]
  }
];

export const QUIZ_MAX_SCORE = quizQuestions.reduce((total, question) => {
  const maxForQuestion = Math.max(...question.options.map((option) => option.score));
  return total + maxForQuestion;
}, 0);

export const CTA_URL = "/";

export const COPY = {
  landing: {
    headline: "You train. You eat ‘clean.’ But your stomach keeps growing?",
    sub: "Take this 60-second assessment to find out what’s really blocking your physique.",
    cta: "Start the Assessment"
  },
  optin: {
    title: "Get your results",
    sub: "We’ll email your diagnostic + the 30-day plan blueprint."
  }
};

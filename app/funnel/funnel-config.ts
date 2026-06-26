// ─────────────────────────────────────────────────────────
// PROTOCOL CLUB — ATTRACTIVENESS DIAGNOSTIC V2.6
// 27 slides: 19 Q · 4 Belief-Shifts · 2 Info · 2 Summary/Promise
// + 1 Final Loading = 28 total (loading counted in Section 7)
// ─────────────────────────────────────────────────────────

import { ACTIVE_VARIANT } from "../../lib/variant";

export type Answers = Record<string, string | string[] | number>;

export type SlideType =
  | "intro"
  | "single"
  | "multi"
  | "numeric-height"
  | "numeric-weight"
  | "belief"
  | "info"
  | "stat"
  | "summary"
  | "promise"
  | "yes-ladder"
  | "final-loading"
  | "optin"
  | "photo-upload"
  | "dream-outcome";

export type SingleSlide = {
  id: string;
  type: "single";
  stateKey: string;
  section: number;
  sectionLabel: string;
  qNumber: number;
  question: string;
  subtext?: string;
  options: string[];
  images?: string[] | ((answers: Answers) => string[]);
  whyWeAsk?: string;
  allowCustom?: boolean;
};

export type MultiSlide = {
  id: string;
  type: "multi";
  stateKey: string;
  section: number;
  sectionLabel: string;
  qNumber: number;
  question: string;
  subtext?: string;
  options: string[];
  images?: string[];
  whyWeAsk?: string;
  allowCustom?: boolean;
};

export type NumericHeightSlide = {
  id: string;
  type: "numeric-height";
  section: number;
  qNumber: number;
  question: string;
  subtext: string;
};

export type NumericWeightSlide = {
  id: string;
  type: "numeric-weight";
  section: number;
  qNumber: number;
  question: string;
  subtext: string;
};

export type BeliefSlide = {
  id: string;
  type: "belief";
  bsNumber: 1 | 2 | 3 | 4;
  headline: string;
  paragraph: string;
  footer: string;
};

export type InfoSlide = {
  id: string;
  type: "info";
  variant: "social-proof" | "objection";
  headline: string;
  body: string;
  // Optional copy overrides resolved from later answers (sexual_orientation).
  // The first matching key wins.
  byOrientation?: Partial<Record<
    "Gay" | "Bisexual" | "Straight" | "Prefer not to say",
    { headline?: string; body?: string }
  >>;
};

export type StatSlide = {
  id: string;
  type: "stat";
  stat: string;
  statLabel: string;
  headline: string;
  source?: string;
};

export type SummarySlide = {
  id: string;
  type: "summary";
};

export type PromiseSlide = {
  id: string;
  type: "promise";
};

export type YesLadderSlide = {
  id: string;
  type: "yes-ladder";
  stateKey: string;
  qNumber: number;
  loaderStep: 1 | 2 | 3; // 25% / 50% / 75%
  loaderLabel: string;
  question: string;
  options: string[];
};

export type FinalLoadingSlide = {
  id: string;
  type: "final-loading";
};

export type OptInSlide = {
  id: string;
  type: "optin";
};

export type IntroSlide = {
  id: string;
  type: "intro";
};

export type ProtocolReadySlide = {
  id: string;
  type: "protocol-ready";
};

export type PhotoUploadSlide = {
  id: string;
  type: "photo-upload";
  photoType?: "body" | "face" | "profile";
  photoTypes?: ("body" | "face" | "profile")[];
};

export type DreamOutcomeSlide = {
  id: string;
  type: "dream-outcome";
  stateKey: string;
  qNumber: number;
  headline: string;
  subtext?: string;
  placeholder: string;
  minChars: number;
  hideCounter?: boolean;
};

export type SlideConfig =
  | IntroSlide
  | SingleSlide
  | MultiSlide
  | NumericHeightSlide
  | NumericWeightSlide
  | BeliefSlide
  | InfoSlide
  | StatSlide
  | SummarySlide
  | PromiseSlide
  | YesLadderSlide
  | FinalLoadingSlide
  | OptInSlide
  | ProtocolReadySlide
  | PhotoUploadSlide
  | DreamOutcomeSlide;

// ─── Dynamic image resolver ───────────────────────────────

const AGE_KEY_MAP: Record<string, string> = {
  "20–29": "20-29",
  "30–39": "30-39",
  "40–49": "40-49",
  "50+": "50plus",
};

const ETHNICITY_KEY_MAP: Record<string, string> = {
  "Caucasian":        "caucasian",
  "Black":            "black",
  "Asian (East / SE)":"asian-east-se",
  "South Asian":      "south-asian",
  "Hispanic-Latino":  "hispanic-latino",
  "MENA":             "mena",
};

function morphologyImages(answers: Answers): string[] {
  const age = AGE_KEY_MAP[answers.age_bracket as string] ?? "20-29";
  const eth = ETHNICITY_KEY_MAP[answers.ethnicity as string] ?? "caucasian";
  const base = `/assets/funnel/morphology/${age}-${eth}`;
  return [
    `${base}-skinny.png`,
    `${base}-skinny-fat.png`,
    `${base}-overweight.png`,
    `${base}-average.png`,
  ];
}

function ethnicityImages(answers: Answers): string[] {
  const age = AGE_KEY_MAP[answers.age_bracket as string] ?? "20-29";
  const base = `/assets/funnel/ethnicity/${age}`;
  return [
    `${base}-caucasian.png`,
    `${base}-black.png`,
    `${base}-asian-east-se.png`,
    `${base}-south-asian.png`,
    `${base}-hispanic-latino.png`,
    `${base}-mena.png`,
    "",
  ];
}

// ─── Projection variant slides ────────────────────────────

const PROJECTION_IDENTITY_SLIDE: SlideConfig = {
  id: "projection_identity",
  type: "multi",
  stateKey: "projection_identity",
  section: 1,
  sectionLabel: "Your Vision",
  qNumber: 1,
  question: "What image do you want to project after your transformation?",
  subtext: "Choose as many as apply.",
  options: [
    "A man who commands respect",
    "Someone who takes care of himself",
    "A man who attracts attention",
    "A high-performer others notice",
    "An athlete's build",
  ],
  allowCustom: true,
};

const PROJECTION_CONTEXT_SLIDE: SlideConfig = {
  id: "projection_context",
  type: "single",
  stateKey: "projection_context",
  section: 1,
  sectionLabel: "Your Vision",
  qNumber: 2,
  question: "Where does this change matter most to you?",
  options: [
    "Professional / Career",
    "Social / Relationships",
    "Dating / Romantic life",
    "Personal confidence",
    "Everywhere",
  ],
  allowCustom: true,
};

const COMBINED_PHOTO_SLIDE: SlideConfig = {
  id: "photo-upload",
  type: "photo-upload",
  photoTypes: ["body", "face", "profile"],
};

// ─── SLIDE SEQUENCE ───────────────────────────────────────

const BASE_SLIDES: SlideConfig[] = [
  // ── INTRO ─────────────────────────────────────────────
  {
    id: "intro",
    type: "intro",
  },

  // ── SECTION 1 — CURRENT SITUATION + PAIN ──────────────

  {
    id: "q1",
    type: "single",
    stateKey: "age_bracket",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 1,
    question: "How old are you?",
    options: ["20–29", "30–39", "40–49", "50+"],
    images: [
      "/assets/20-29.png",
      "/assets/30-39.png",
      "/assets/40-49.png",
      "/assets/+50.png",
    ],
  },

  {
    id: "dream-outcome",
    type: "multi",
    stateKey: "dream_outcome",
    section: 1,
    sectionLabel: "Your Vision",
    qNumber: 30,
    question: "What are you really trying to achieve in your personal life?",
    subtext: "Select all that apply.",
    options: [
      "Feel confident and desirable to others",
      "A specific physical transformation (less fat, more muscle, defined shape)",
      "Inner peace, confidence and self-respect",
      "A healthier body that ages well",
      "More freedom and success in other areas of my life",
    ],
    allowCustom: true,
  },

  {
    id: "stat-age",
    type: "stat",
    stat: "87%",
    statLabel: "of men your age",
    headline: "say their physique directly affects how they're perceived at work and socially",
    source: "Body Image & Self-Esteem in Men, Journal of Health Psychology, 2022",
  },

  {
    id: "q6b",
    type: "single",
    stateKey: "ethnicity",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 2,
    question: "Which best describes you?",
    subtext: "Helps us calibrate your visual reference points.",
    options: [
      "Caucasian",
      "Black",
      "Asian (East / SE)",
      "South Asian",
      "Hispanic-Latino",
      "MENA",
      "Prefer not to say",
    ],
    images: ethnicityImages,
  },

  {
    id: "q2",
    type: "single",
    stateKey: "morphology",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 3,
    question: "What's your body type right now?",
    options: [
      "Skinny",
      "Skinny-fat",
      "Overweight",
      "Average",
    ],
    images: morphologyImages,
  },

  {
    id: "pain-friction",
    type: "multi",
    stateKey: "pain_friction",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 31,
    question: "What does your body stop you from doing today?",
    subtext: "Select all that apply.",
    options: [
      "Taking my shirt off in public",
      "Wearing tight or revealing clothes (speedo, tank top, crop top)",
      "Beach or pool moments",
      "Photos of myself",
      "Going to events or social scenes",
      "Approaching or interacting with people I'm attracted to",
      "Nothing specific, it's more a general feeling",
    ],
    allowCustom: true,
  },

  {
    id: "q4",
    type: "single",
    stateKey: "pain_timeline",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 4,
    question: "How long has this been the case?",
    options: [
      "Over a year ago",
      "In the past year",
      "In the past few months",
      "Not sure",
    ],
  },

  {
    id: "q5b",
    type: "single",
    stateKey: "sexual_orientation",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 6,
    question: "What's your sexual orientation?",
    whyWeAsk: "Standards of attractiveness, physique ideals, and style references differ depending on who you're optimizing for. Your protocol is calibrated accordingly.",
    options: [
      "Straight",
      "Gay",
      "Bisexual",
      "Other",
      "Prefer not to say",
    ],
  },

  {
    id: "info0",
    type: "info",
    variant: "social-proof",
    headline: "2,500+ men have already taken this assessment.",
    body: "Built on 4 years of R&D and a dataset of 2,500+ men who have reached their peak potential.",
    byOrientation: {
      Gay: {
        headline: "2,500+ gay men have already taken this assessment.",
      },
      Bisexual: {
        headline: "2,500+ bisexual men have already taken this assessment.",
      },
    },
  },


  {
    id: "q_height",
    type: "numeric-height",
    section: 1,
    qNumber: 8,
    question: "What's your height?",
    subtext: "Used to calibrate your structural targets.",
  },

  {
    id: "q_weight",
    type: "numeric-weight",
    section: 1,
    qNumber: 9,
    question: "What's your current weight?",
    subtext: "Determines your body composition baseline. Never shared externally.",
  },

  {
    id: "q_time",
    type: "single",
    stateKey: "weekly_time",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 10,
    question: "How much time do you put into your physique each week?",
    subtext: "Our Protocol is built to fit your schedule, not the other way around.",
    options: [
      "Zero effort right now",
      "Less than 1 hour",
      "1 to 3 hours",
      "3 to 5 hours",
      "More than 5 hours",
    ],
  },

  {
    id: "info_time",
    type: "info",
    variant: "objection",
    headline: "A busy schedule won't make your transformation harder.",
    body: "Looking and feeling your best doesn't require hours a day. Based on your answers, we'll build a Protocol that fits into your life: precise, efficient, and designed around your actual schedule.",
  },

  {
    id: "q_past_solutions",
    type: "multi",
    stateKey: "past_solutions",
    section: 1,
    sectionLabel: "Current Situation",
    qNumber: 12,
    question: "What have you tried before?",
    subtext: "Select all that apply.",
    options: [
      "Personal trainer",
      "YouTube advice",
      "A strict diet",
      "Surgery or medical procedures",
      "Nothing yet",
    ],
    whyWeAsk: "The fitness and weight-loss industry works well for men who want to build muscle or lose weight. But it was never designed for men who want to be attractive. Training for size and training for attractiveness are two completely different goals.",
  },

  // ── SECTION 6 — SUMMARY + PROMISE ─────────────────────

  {
    id: "photo-upload",
    type: "photo-upload",
  },

  {
    id: "summary",
    type: "summary",
  },

  {
    id: "how-it-works",
    type: "info",
    variant: "objection",
    headline: "You're about to see a protocol built to improve your attractiveness.",
    body: "Every recommendation is calculated from two sources: 3,000+ peer-reviewed studies on male attractiveness and a reference dataset of 2,500+ measured men.\n\nIt's the specific changes that move your attractiveness score.",
  },

  {
    id: "promise",
    type: "promise",
  },

  // ── SECTION 7 — SOLUTION FRAMING ──────────────────────

  {
    id: "q16b",
    type: "yes-ladder",
    stateKey: "yes_uniqueness",
    qNumber: 16,
    loaderStep: 1,
    loaderLabel: "Analyzing your profile...",
    question: "Did you know attractiveness is unique to each person, shaped by age, face, social context, and genetics?",
    options: ["Yes", "No"],
  },

  {
    id: "q17",
    type: "yes-ladder",
    stateKey: "yes_determination",
    qNumber: 17,
    loaderStep: 2,
    loaderLabel: "Generating your personalized protocol...",
    question: "Are you ready to improve your attractiveness using science?",
    options: ["Yes", "No"],
  },

  {
    id: "q18",
    type: "yes-ladder",
    stateKey: "yes_protocol",
    qNumber: 18,
    loaderStep: 3,
    loaderLabel: "Generating your 12-week protocol...",
    question: "Would a simple, science-backed protocol built specifically for your body interest you?",
    options: ["Yes", "No"],
  },

  {
    id: "final-loading",
    type: "final-loading",
  },

  {
    id: "optin",
    type: "optin",
  },

  {
    id: "protocol-ready",
    type: "protocol-ready",
  },
];

// ─── Computed slide sequence (variant-aware) ──────────────

function buildSlides(): SlideConfig[] {
  if (ACTIVE_VARIANT !== "projection") return BASE_SLIDES;

  // Insert projection questions after intro
  const withProjection: SlideConfig[] = [
    BASE_SLIDES[0],
    PROJECTION_IDENTITY_SLIDE,
    PROJECTION_CONTEXT_SLIDE,
    ...BASE_SLIDES.slice(1),
  ];

  // Replace the single body photo slide with the combined 3-photo slide
  return withProjection.map((s) =>
    s.id === "photo-upload" ? COMBINED_PHOTO_SLIDE : s
  );
}

export const SLIDES: SlideConfig[] = buildSlides();

// ─── Helpers ──────────────────────────────────────────────

export function isQuestion(slide: SlideConfig): boolean {
  return (
    slide.type === "single" ||
    slide.type === "multi" ||
    slide.type === "numeric-height" ||
    slide.type === "numeric-weight" ||
    slide.type === "yes-ladder" ||
    slide.type === "dream-outcome"
  );
}

export const TOTAL_QUESTIONS = SLIDES.filter(isQuestion).length;

export function questionsAnsweredUpTo(slides: SlideConfig[], upToIndex: number): number {
  return slides.slice(0, upToIndex + 1).filter(isQuestion).length;
}

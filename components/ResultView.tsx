import { CTA_URL } from "../lib/quizConfig";
import type { ScoringResult } from "../lib/scoring";

type ResultViewProps = {
  result: ScoringResult;
  onCtaClick: () => void;
};

const resultCopy = {
  high: {
    headline: "You’re not lazy. You’re miscalibrated.",
    body:
      "You’re using strategies designed for already-muscular guys. That’s why cutting makes you smaller, bulking makes you softer, and cardio keeps you flat.",
    bullets: [
      "You’ve been training hard but the signal isn’t strong enough to build muscle.",
      "Your nutrition looks clean, but the intake is miscalibrated for recomposition.",
      "Your cardio volume is likely crowding out muscle gain."
    ],
    cta: "See the 30-Day Protocol Plan"
  },
  beginner: {
    headline: "You don’t need a ‘perfect method.’ You need structure.",
    body: "A simple hypertrophy plan + protein calibration beats random HIIT.",
    bullets: [
      "Build a consistent lifting base before chasing fat loss.",
      "Lock in protein and total calories to support growth.",
      "Track progress weekly so you can adjust with confidence."
    ],
    cta: "See the 30-Day Protocol Plan"
  },
  low: {
    headline: "You’re closer than you think.",
    body: "Your answers show fewer skinny-fat markers, but a few adjustments could accelerate results.",
    bullets: [
      "Prioritize progressive overload so the mirror changes with the scale.",
      "Calibrate calories instead of guessing — even when eating clean.",
      "Use cardio strategically, not as the main driver."
    ],
    cta: "Optional: See the 30-Day Protocol Plan"
  }
};

export function ResultView({ result, onCtaClick }: ResultViewProps) {
  const copy =
    result.segment === "Skinny-Fat Trap (High likelihood)"
      ? resultCopy.high
      : result.segment === "Undertrained Beginner"
      ? resultCopy.beginner
      : resultCopy.low;

  return (
    <div className="rounded-3xl border border-black bg-white p-6 shadow-hard">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.4em] text-charcoal/70">Your Results</p>
        <h2 className="text-3xl font-display font-semibold text-ink">{copy.headline}</h2>
        <p className="text-base text-charcoal">{copy.body}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-fog p-4">
        <p className="text-sm font-semibold text-charcoal">
          Skinny-Fat Trap Likelihood: <span className="text-ink">{result.score}/100</span>
        </p>
        <p className="mt-2 text-sm text-charcoal">
          Primary blocker: <span className="font-semibold text-ink">{result.blocker}</span>
        </p>
      </div>

      <ul className="mt-5 list-disc pl-5 text-base text-charcoal">
        {copy.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <a
        href={CTA_URL}
        onClick={onCtaClick}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-black px-5 py-3 text-base font-semibold text-white transition hover:bg-charcoal"
      >
        {copy.cta}
      </a>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-charcoal/70">
        We’ll send the 30-day blueprint to your email as well.
      </p>
    </div>
  );
}

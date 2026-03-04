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
    <div className="card-raise rounded-3xl border border-black/20 bg-white p-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.4em] text-black/60">Your Results</p>
        <h2 className="text-3xl font-display font-semibold uppercase tracking-[0.1em] text-black">
          {copy.headline}
        </h2>
        <p className="text-base text-black/70">{copy.body}</p>
      </div>

      <div className="mt-5 rounded-2xl border border-black/10 bg-black/5 p-4">
        <p className="text-sm font-semibold text-black/80">
          Skinny-Fat Trap Likelihood: <span className="text-black">{result.score}/100</span>
        </p>
        <p className="mt-2 text-sm text-black/70">
          Primary blocker: <span className="font-semibold text-black">{result.blocker}</span>
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {copy.bullets.map((bullet) => (
          <div key={bullet} className="border-l-2 border-black/60 pl-4 text-base text-black/75">
            {bullet}
          </div>
        ))}
      </div>

      <a
        href={CTA_URL}
        onClick={onCtaClick}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-black bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black"
      >
        {copy.cta}
      </a>
      <p className="mt-3 text-xs uppercase tracking-[0.3em] text-black/50">
        We’ll send the 30-day blueprint to your email as well.
      </p>
    </div>
  );
}

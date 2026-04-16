import type { CalibrationMetrics } from "../admin/orders/[userId]/PhotoCalibrator";
import { computeAttractivenessScore, computeRealisticPotential, getAgeRanges } from "../../lib/attractivenessScore";

const METRIC_DEFS: {
  key:   keyof CalibrationMetrics;
  abbr:  string;
  label: string;
  range: [number, number];
  fmt:   (v: number) => string;
}[] = [
  { key: "swr", abbr: "SWR", label: "Shoulder-Waist Ratio", range: [1.41, 1.63], fmt: (v) => String(v) },
  { key: "cwr", abbr: "CWR", label: "Chest-Waist Ratio",    range: [1.25, 1.35], fmt: (v) => String(v) },
  { key: "bf",  abbr: "BF%", label: "Body Fat",             range: [10,   17   ], fmt: (v) => `${Math.max(6, v - 2)}–${Math.min(40, v + 2)}%` },
  { key: "pas", abbr: "PAS", label: "Posture Score",         range: [80,   95   ], fmt: (v) => String(v) },
  { key: "ti",  abbr: "TI",  label: "Taper Index",           range: [1.1,  1.5  ], fmt: (v) => String(v) },
  { key: "pc",  abbr: "PC",  label: "Proportion",            range: [75,   95   ], fmt: (v) => String(v) },
];

function status(key: keyof CalibrationMetrics, value: number, age?: number): "good" | "warn" | "bad" {
  const ranges = age != null ? getAgeRanges(age) : Object.fromEntries(
    METRIC_DEFS.map(d => [d.key, d.range])
  ) as Record<keyof CalibrationMetrics, [number, number]>;
  const [min, max] = ranges[key];
  if (key === "bf") {
    if (value >= min && value <= max) return "good";
    // warn zone: up to 4% above the age-adjusted max
    return value <= max + 4 ? "warn" : "bad";
  }
  if (value >= min && value <= max) return "good";
  const gap = Math.min(Math.abs(value - min), Math.abs(value - max));
  return gap < (max - min) * 0.8 ? "warn" : "bad";
}

const STATUS_COLORS = {
  good: "text-emerald-700 bg-emerald-50 border-emerald-100",
  warn: "text-amber-700  bg-amber-50  border-amber-100",
  bad:  "text-red-700    bg-red-50    border-red-100",
};

const SCORE_BADGE: Record<string, string> = {
  "Elite":         "bg-emerald-50 text-emerald-700",
  "High":          "bg-emerald-50 text-emerald-700",
  "Above Average": "bg-sky-50 text-sky-700",
  "Average":       "bg-amber-50 text-amber-700",
  "Below Average": "bg-amber-50 text-amber-700",
  "Needs Work":    "bg-red-50 text-red-700",
};

const SCORE_VALUE_COLOR: Record<string, string> = {
  "Elite":         "text-emerald-600",
  "High":          "text-emerald-600",
  "Above Average": "text-sky-600",
  "Average":       "text-amber-600",
  "Below Average": "text-amber-600",
  "Needs Work":    "text-red-600",
};

export default function MetricsPanel({ metrics, age }: { metrics: CalibrationMetrics; age?: number }) {
  const { score, label } = computeAttractivenessScore(metrics, age);
  const potential = age != null ? computeRealisticPotential(metrics, age) : null;
  const badgeClass = SCORE_BADGE[label] ?? "bg-pebble text-dim";
  const valueClass = SCORE_VALUE_COLOR[label] ?? "text-void";

  return (
    <div className="mb-10 rounded-2xl border border-wire bg-ash p-4 sm:p-6">
      {/* ── Score + Potential (fusionnés) ── */}
      <div className="mb-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
          Physical Attractiveness Score{age != null ? ` · Age ${age}` : ""}
        </p>

        <div className="flex items-end justify-between gap-3">
          {/* Current score */}
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display text-[44px] font-semibold leading-none tabular-nums sm:text-[52px] ${valueClass}`}>
              {score}
            </span>
            <span className="text-[16px] font-semibold text-mute sm:text-[18px]">/100</span>
          </div>

          {/* Divider + Potential (only when age known) */}
          {potential ? (
            <div className="flex items-stretch gap-3 sm:gap-4">
              <div className="w-px self-stretch bg-wire" />
              <div className="flex flex-col items-end gap-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-mute">
                  Potential
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[24px] font-semibold leading-none tabular-nums text-void sm:text-[28px]">
                    {potential.max}
                  </span>
                  <span className="text-[12px] font-semibold text-mute sm:text-[13px]">/100</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${SCORE_BADGE[potential.label] ?? "bg-pebble text-dim"}`}>
                  {potential.label}
                </span>
                <p className="text-right text-[9px] text-mute max-w-[130px] leading-snug sm:max-w-[150px]">
                  {potential.execution}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${badgeClass}`}>
                {label}
              </span>
              <p className="text-right text-[9.5px] leading-snug text-mute max-w-[160px]">
                Weighted composite · 6 metrics · 50+ peer-reviewed studies
              </p>
            </div>
          )}
        </div>

        {/* Current label badge (when potential shown, put it under the score) */}
        {potential && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${badgeClass}`}>
              {label}
            </span>
            <p className="text-[9px] text-mute">
              now · weighted composite · 6 metrics
            </p>
          </div>
        )}
      </div>

      {/* ── Graduation bar ── */}
      {(() => {
        const toPct = (v: number) => `${v}%`;
        const zones: { label: string; left: string; width: string; align: "left" | "center" | "right" }[] = [
          { label: "Above Avg", left: "55%", width: "15%", align: "center" },
          { label: "High",      left: "70%", width: "15%", align: "center" },
          { label: "Elite",     left: "85%", width: "15%", align: "center" },
        ];
        return (
          <div className="mb-6">
            {/* Zone labels above the bar */}
            <div className="relative mb-1.5 h-4">
              {zones.map(({ label, left, width }) => (
                <div
                  key={label}
                  className="absolute flex items-center justify-center"
                  style={{ left, width }}
                >
                  <span className="text-[9px] font-semibold text-mute whitespace-nowrap">{label}</span>
                </div>
              ))}
            </div>

            {/* Bar */}
            <div className="relative h-2.5 rounded-full bg-[#f0f0ef] overflow-hidden">
              <div className="absolute inset-y-0 bg-[#e5e5e4]"   style={{ left: "0%",  width: "55%" }} />
              <div className="absolute inset-y-0 bg-sky-200"     style={{ left: "55%", width: "15%" }} />
              <div className="absolute inset-y-0 bg-emerald-100" style={{ left: "70%", width: "15%" }} />
              <div className="absolute inset-y-0 bg-emerald-300" style={{ left: "85%", width: "15%" }} />
            </div>

            {/* Cursors — overlaid on the bar */}
            <div className="relative -mt-2.5 h-2.5">
              {potential && (
                <div
                  className="absolute top-0 h-2.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[#999] bg-white shadow-sm"
                  style={{ left: toPct(potential.max) }}
                />
              )}
              <div
                className={`absolute top-0 h-2.5 w-3.5 -translate-x-1/2 rounded-full ring-2 ring-white shadow ${valueClass.replace("text-", "bg-")}`}
                style={{ left: toPct(score) }}
              />
            </div>

            {/* "now" / "target" labels */}
            <div className="relative mt-2 h-4">
              <span className="absolute left-0 text-[9px] font-semibold text-mute">0</span>
              <span
                className={`absolute -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap ${valueClass}`}
                style={{ left: toPct(score) }}
              >
                {score} · now
              </span>
              {potential && Math.abs(potential.max - score) > 5 && (
                <span
                  className="absolute -translate-x-1/2 text-[9px] font-semibold text-[#999] whitespace-nowrap"
                  style={{ left: `min(${toPct(potential.max)}, calc(100% - 32px))` }}
                >
                  {potential.max} · target
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Individual metrics ── */}
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
        Breakdown
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {METRIC_DEFS.map(({ key, abbr, label: metricLabel, fmt }) => {
          const s = status(key, metrics[key], age);
          return (
            <div
              key={key}
              className={`rounded-xl border px-2 py-3 text-center ${STATUS_COLORS[s]}`}
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] opacity-60">
                {abbr}
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums leading-none">
                {fmt(metrics[key])}
              </p>
              <p className="mt-1 text-[8.5px] leading-tight opacity-50">{metricLabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

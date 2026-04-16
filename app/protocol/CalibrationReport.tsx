import React from "react";
import type { CalibrationMetrics, OverlayPoints } from "../admin/orders/[userId]/PhotoCalibrator";

/* ─── Citations ──────────────────────────────────────────────────────────────── */

const CITATION_LINKS: Record<string, string> = {
  "Maisey 1999":            "https://scholar.google.com/scholar?q=Maisey+1999+waist+shoulder+male+attractiveness",
  "Sell 2017":              "https://scholar.google.com/scholar?q=Sell+2017+shoulder+waist+ratio+male+physical+dominance",
  "Stulp 2015":             "https://scholar.google.com/scholar?q=Stulp+2015+human+height+attractiveness+review",
  "Stulp 2013":             "https://scholar.google.com/scholar?q=Stulp+2013+tall+claims+humans+height+dominance+attractiveness",
  "Tovée 2000":             "https://scholar.google.com/scholar?q=Tovee+2000+body+mass+index+female+attractiveness",
  "Crossley 2012":          "https://scholar.google.com/scholar?q=Crossley+2012+good+genes+body+condition+male+attractiveness",
  "Carney 2010":            "https://scholar.google.com/scholar?q=Carney+Cuddy+Yap+2010+power+posing+brief+nonverbal+displays",
  "De la Rosa 2011":        "https://scholar.google.com/scholar?q=de+la+Rosa+2011+posture+perceived+height+attractiveness",
  "Nettle 2002":            "https://scholar.google.com/scholar?q=Nettle+2002+height+reproductive+success+men",
  "Langlois 1994":          "https://scholar.google.com/scholar?q=Langlois+1994+attractive+faces+are+only+average",
  "Rhodes 2006":            "https://scholar.google.com/scholar?q=Rhodes+2006+evolutionary+psychology+facial+attractiveness",
  "Pawłowski 2000":         "https://scholar.google.com/scholar?q=Pawlowski+2000+height+male+attractiveness+women+preferences",
  "Leproult & Van Cauter 2011": "https://scholar.google.com/scholar?q=Leproult+Van+Cauter+2011+sleep+testosterone+men",
  "Neave & Shields 2008":   "https://scholar.google.com/scholar?q=Neave+Shields+2008+effects+facial+hair+perception+attractiveness",
  "Grammer 1996":           "https://scholar.google.com/scholar?q=Grammer+1996+body+language+dominance+signals",
  "Puts 2005":              "https://scholar.google.com/scholar?q=Puts+2005+mating+context+vocal+attractiveness+men",
};

/** Renders text with study citations as clickable links opening in a new tab. */
function CitedText({ children, className }: { children: string; className?: string }) {
  const pattern = /\(([^)]+\d{4}[^)]*)\)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(children)) !== null) {
    if (match.index > last) parts.push(children.slice(last, match.index));
    const raw = match[1]; // e.g. "Maisey 1999; Sell 2017"
    // Split on semicolons to handle multiple citations in one bracket
    const refs = raw.split(";").map(r => r.trim());
    const linked = refs.map((ref, i) => {
      const url = CITATION_LINKS[ref];
      return url
        ? <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-inherit underline decoration-dotted underline-offset-2 hover:decoration-solid">{ref}</a>
        : <span key={i}>{ref}</span>;
    });
    parts.push(<span key={match.index}>(</span>);
    linked.forEach((el, i) => {
      parts.push(el);
      if (i < linked.length - 1) parts.push("; ");
    });
    parts.push(<span key={`${match.index}-close`}>)</span>);
    last = match.index + match[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));

  return <p className={className}>{parts}</p>;
}

/* ─── Constants ─────────────────────────────────────────────────────────────── */

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63], cwr: [1.25, 1.35], bf: [10, 17],
  pas: [80,   95  ], ti:  [1.1,  1.5 ], pc: [75, 95],
};

function metricStatus(key: keyof CalibrationMetrics, v: number): "good" | "warn" | "bad" {
  const [mn, mx] = RANGES[key];
  if (key === "bf") return v >= mn && v <= mx ? "good" : v <= 22 ? "warn" : "bad";
  if (v >= mn && v <= mx) return "good";
  return Math.min(Math.abs(v - mn), Math.abs(v - mx)) < (mx - mn) * 0.8 ? "warn" : "bad";
}

const STATUS_COLORS = {
  good: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", label: "Optimal" },
  warn: { badge: "bg-amber-50 text-amber-700",     dot: "bg-amber-500",   label: "Improve" },
  bad:  { badge: "bg-red-50 text-red-700",          dot: "bg-red-500",     label: "Priority" },
};

function fmtVal(key: keyof CalibrationMetrics, v: number) {
  if (key === "bf") return `${Math.max(6, v - 2)}–${Math.min(40, v + 2)}%`;
  if (key === "pas" || key === "pc") return `${v}/100`;
  return String(v);
}

function fmtRange(key: keyof CalibrationMetrics) {
  const [mn, mx] = RANGES[key];
  return key === "bf" ? `${mn}–${mx}%` : `${mn}–${mx}`;
}

/* ─── Scientific explanations (English) ─────────────────────────────────────── */

const META: Record<keyof CalibrationMetrics, { abbr: string; full: string; text: string }> = {
  swr: {
    abbr: "SWR",
    full: "Shoulder-Waist Ratio",
    text: "Cross-cultural studies (Maisey 1999; Sell 2017) identify the shoulder-to-waist ratio as the single strongest predictor of male attractiveness — ranking above facial features, height, or raw muscularity. Relative shoulder breadth is partly determined by testosterone during puberty, making it a biological marker of genetic health that observers process unconsciously. The optimal zone (1.41–1.63) corresponds to the classic V-shape: pronounced enough to create a distinct silhouette, without reaching the extreme proportions of competitive athletes.",
  },
  cwr: {
    abbr: "CWR",
    full: "Chest-Waist Ratio",
    text: "Chest prominence relative to the waist is a consistent secondary attractiveness signal (Stulp 2015). A developed torso indicates respiratory capacity and upper-body functional strength — attributes valued in social competition contexts. A CWR within the target zone (1.25–1.35) creates front-facing visual depth that amplifies the perceived SWR and gives presence to the silhouette.",
  },
  bf: {
    abbr: "BF%",
    full: "Body Fat %",
    text: "Tovée (2000) and Crossley (2012) show that body fat percentage significantly influences physical attractiveness independently of SWR. The 10–17% zone is the sweet spot in urban Western contexts: visible muscle definition without the depleted look of competitors. Below 10%, the physique can read as extreme; above 22%, visceral fat reduces the visual readability of SWR and CWR by erasing the visual contrast between waist and chest.",
  },
  ti: {
    abbr: "TI",
    full: "Taper Index",
    text: "The Taper Index measures the taper of the silhouette — how the shoulders project relative to the hips. Distinct from SWR, it captures a complementary dimension: one can have broad shoulders with wide hips and a low TI that reduces the perceived V. Stulp (2013) shows this morphological axis is directly associated with judgments of physical dominance and protective strength, two salient attributes in male social competition dynamics.",
  },
  pas: {
    abbr: "PAS",
    full: "Posture Alignment Score",
    text: "Upright posture is a universal signal of confidence and social dominance (Carney 2010). Biomechanically, a forward head position or rounded shoulders visually reduce shoulder breadth — directly impacting perceived SWR. De la Rosa (2011) and Nettle (2002) show that perceived height, which correlates with male attractiveness (r ≈ 0.3–0.4), depends as much on postural alignment as on actual height.",
  },
  pc: {
    abbr: "PC",
    full: "Proportion Coherence",
    text: "This composite score measures how well your individual metrics form a harmonious whole. Attractiveness research (Langlois 1994; Rhodes 2006) shows that proportional coherence is intrinsically perceived as attractive — the brain processes proportional harmony as a signal of good developmental health. A high PC means your overall silhouette reads correctly, even if no single metric reaches an extreme level.",
  },
};

/* ─── Annotated photo overlay (exact match to calibration tool) ──────────────── */

type FrontFilter = "swr" | "cwr" | "ti";

function FrontOverlay({ points, metrics, filter }: { points: OverlayPoints; metrics: CalibrationMetrics; filter?: FrontFilter }) {
  const { shoulderLeft: sl, shoulderRight: sr, chestLeft: cl, chestRight: cr, waistLeft: wl, waistRight: wr } = points;
  const shoulderY = (sl.y + sr.y) / 2;
  const chestY    = (cl.y + cr.y) / 2;
  const waistY    = (wl.y + wr.y) / 2;

  const show = (key: FrontFilter) => !filter || filter === key;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* Taper lines shoulder → waist — only when showing TI or all */}
      {show("ti") && <>
        <line x1={sl.x} y1={shoulderY} x2={wl.x} y2={waistY} stroke="rgba(240,190,90,0.4)" strokeWidth="0.2" strokeDasharray="1.2 0.8" />
        <line x1={sr.x} y1={shoulderY} x2={wr.x} y2={waistY} stroke="rgba(240,190,90,0.4)" strokeWidth="0.2" strokeDasharray="1.2 0.8" />
      </>}

      {/* Shoulder band — SWR */}
      {show("swr") && <>
        <line x1={sl.x} y1={shoulderY} x2={sr.x} y2={shoulderY} stroke="rgba(120,230,160,1)" strokeWidth="0.25" />
        <circle cx={sl.x} cy={shoulderY} r={0.6} fill="rgba(120,230,160,1)" />
        <circle cx={sr.x} cy={shoulderY} r={0.6} fill="rgba(120,230,160,1)" />
        <line x1={sl.x} y1={shoulderY - 2} x2={sl.x} y2={shoulderY + 2} stroke="rgba(120,230,160,1)" strokeWidth="0.4" />
        <line x1={sr.x} y1={shoulderY - 2} x2={sr.x} y2={shoulderY + 2} stroke="rgba(120,230,160,1)" strokeWidth="0.4" />
        <text x={(sl.x + sr.x) / 2} y={shoulderY - 2.5} textAnchor="middle" fontSize="2.2" fill="rgba(120,230,160,0.9)" fontWeight="700" letterSpacing="0.3">
          SHOULDERS · SWR {metrics.swr}
        </text>
      </>}

      {/* Chest band — CWR */}
      {show("cwr") && <>
        <line x1={cl.x} y1={chestY} x2={cr.x} y2={chestY} stroke="rgba(200,160,250,1)" strokeWidth="0.25" />
        <circle cx={cl.x} cy={chestY} r={0.6} fill="rgba(200,160,250,1)" />
        <circle cx={cr.x} cy={chestY} r={0.6} fill="rgba(200,160,250,1)" />
        <line x1={cl.x} y1={chestY - 2} x2={cl.x} y2={chestY + 2} stroke="rgba(200,160,250,1)" strokeWidth="0.4" />
        <line x1={cr.x} y1={chestY - 2} x2={cr.x} y2={chestY + 2} stroke="rgba(200,160,250,1)" strokeWidth="0.4" />
        <text x={(cl.x + cr.x) / 2} y={chestY - 2.5} textAnchor="middle" fontSize="2.2" fill="rgba(200,160,250,0.9)" fontWeight="700" letterSpacing="0.3">
          CHEST · CWR {metrics.cwr}
        </text>
      </>}

      {/* Waist band — TI */}
      {show("ti") && <>
        <line x1={wl.x} y1={waistY} x2={wr.x} y2={waistY} stroke="rgba(240,190,90,1)" strokeWidth="0.25" />
        <circle cx={wl.x} cy={waistY} r={0.6} fill="rgba(240,190,90,1)" />
        <circle cx={wr.x} cy={waistY} r={0.6} fill="rgba(240,190,90,1)" />
        <line x1={wl.x} y1={waistY - 2} x2={wl.x} y2={waistY + 2} stroke="rgba(240,190,90,1)" strokeWidth="0.4" />
        <line x1={wr.x} y1={waistY - 2} x2={wr.x} y2={waistY + 2} stroke="rgba(240,190,90,1)" strokeWidth="0.4" />
        <text x={(wl.x + wr.x) / 2} y={waistY + 4} textAnchor="middle" fontSize="2.2" fill="rgba(240,190,90,0.9)" fontWeight="700" letterSpacing="0.3">
          WAIST · TI {metrics.ti}
        </text>
      </>}
    </svg>
  );
}

function SideOverlay({ points, metrics }: { points: OverlayPoints; metrics: CalibrationMetrics }) {
  const { postureTop: pt, postureBottom: pb } = points;
  const midX = (pt.x + pb.x) / 2;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* Ideal vertical reference */}
      <line x1={midX} y1={pt.y} x2={midX} y2={pb.y} stroke="rgba(160,180,240,0.2)" strokeWidth="0.3" strokeDasharray="2 2" />
      {/* Actual posture axis */}
      <line x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y} stroke="rgba(160,180,240,1)" strokeWidth="0.3" strokeDasharray="2 1.5" />
      {/* Endpoint circles */}
      <circle cx={pt.x} cy={pt.y} r={1.2} fill="rgba(160,180,240,1)" />
      <circle cx={pb.x} cy={pb.y} r={1.2} fill="rgba(160,180,240,1)" />
      {/* Labels */}
      <text x={pt.x + 2.5} y={pt.y + 1} fontSize="2.2" fill="rgba(160,180,240,0.8)" fontWeight="600">EAR</text>
      <text x={pb.x + 2.5} y={pb.y - 1} fontSize="2.2" fill="rgba(160,180,240,0.8)" fontWeight="600">ANKLE</text>
      <text
        x={Math.max(pt.x, pb.x) + 3.5}
        y={(pt.y + pb.y) / 2}
        textAnchor="start" fontSize="2.4" fill="rgba(160,180,240,1)" fontWeight="700" letterSpacing="0.3"
      >
        PAS {metrics.pas}
      </text>
    </svg>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function RangeBar({ metricKey, value }: { metricKey: keyof CalibrationMetrics; value: number }) {
  const [mn, mx] = RANGES[metricKey];
  const span    = mx - mn;
  const barMin  = mn - span * 0.6;
  const barMax  = mx + span * 0.6;
  const barSpan = barMax - barMin;
  const pct        = Math.max(2, Math.min(98, ((value - barMin) / barSpan) * 100));
  const rangeStart = ((mn - barMin) / barSpan) * 100;
  const rangeWidth = ((mx - mn) / barSpan) * 100;
  const s = metricStatus(metricKey, value);

  return (
    <div className="relative h-[5px] rounded-full bg-[#f0f0ef]">
      <div
        className="absolute h-full rounded-full bg-emerald-200"
        style={{ left: `${rangeStart}%`, width: `${rangeWidth}%` }}
      />
      <div
        className={`absolute top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-[2.5px] ring-white shadow-sm ${STATUS_COLORS[s].dot}`}
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

function MetricCard({ metricKey, value }: { metricKey: keyof CalibrationMetrics; value: number }) {
  const s = metricStatus(metricKey, value);
  const { abbr, full, text } = META[metricKey];

  return (
    <div className="border-b border-[#eeeeed] py-7 last:border-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 rounded-md bg-[#f5f5f4] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#888]">
            {abbr}
          </span>
          <span className="text-[15px] font-semibold text-[#111] leading-snug">{full}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[17px] font-semibold tabular-nums text-[#111]">
            {fmtVal(metricKey, value)}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] ${STATUS_COLORS[s].badge}`}>
            {STATUS_COLORS[s].label}
          </span>
        </div>
      </div>

      <RangeBar metricKey={metricKey} value={value} />
      <div className="mt-1.5 flex justify-between text-[10px] text-[#999]">
        <span>Optimal range: {fmtRange(metricKey)}</span>
      </div>

      <CitedText className="mt-4 text-[13.5px] leading-[1.7] text-[#555]">{text}</CitedText>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

/* ─── Annex sections ─────────────────────────────────────────────────────────── */

function AnnexDivider({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="shrink-0 rounded bg-[#f5f5f4] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#999]">
        Annex
      </span>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#aaa]">{title}</p>
      <div className="h-px flex-1 bg-[#eeeeed]" />
    </div>
  );
}

function AnnexCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#eeeeed] bg-[#fafafa] p-6">
      {children}
    </div>
  );
}

function AnnexHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[12px] font-semibold text-[#222]">{children}</p>
  );
}

function AnnexText({ children }: { children: React.ReactNode }) {
  if (typeof children === "string") {
    return <CitedText className="text-[13px] leading-[1.7] text-[#555]">{children}</CitedText>;
  }
  return <p className="text-[13px] leading-[1.7] text-[#555]">{children}</p>;
}

function HeightAnnex({ heightCm }: { heightCm?: number }) {
  const heightContext = heightCm
    ? heightCm >= 185
      ? "Tall — above the range where height provides the strongest attractiveness gains."
      : heightCm >= 177
      ? "Above average — in the zone where height provides a clear social and perceptual advantage."
      : heightCm >= 170
      ? "Average range — height is not a disadvantage, and posture optimization is fully effective here."
      : "Below average — posture and SWR carry proportionally more weight at this height; maximizing both is the highest-leverage investment."
    : null;

  return (
    <div className="mb-10">
      <AnnexDivider title="Height" />
      <AnnexCard>
        {heightCm && (
          <div className="mb-5 flex items-baseline gap-2">
            <span className="font-mono text-[36px] font-semibold leading-none tabular-nums text-[#111]">
              {heightCm}
            </span>
            <span className="text-[16px] font-semibold text-[#999]">cm</span>
            {heightContext && (
              <span className="ml-2 text-[12px] leading-snug text-[#666]">{heightContext}</span>
            )}
          </div>
        )}

        <AnnexHeading>What the research says</AnnexHeading>
        <AnnexText>
          Height correlates consistently with male attractiveness across cultures (Nettle 2002; Pawłowski 2000; Stulp 2013).
          The effect is real but non-linear: gains are strongest below ~183cm and plateau above it.
          Taller men are perceived as higher-status, more dominant, and more attractive as long-term partners.
          Height is approximately 80% heritable and established in early adulthood — no training protocol changes your skeletal height.
        </AnnexText>

        <div className="mt-4 rounded-lg border border-[#e8e8e6] bg-white p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">What you control</p>
          <AnnexText>
            Postural alignment (your PAS score) directly affects <em>perceived</em> height.
            Forward head posture and thoracic kyphosis can reduce apparent height by 2–5cm.
            Every point gained on PAS is effectively a height gain in the perception of observers — without adding a centimeter to your skeleton.
          </AnnexText>
        </div>
      </AnnexCard>
    </div>
  );
}

function FacialAnnex() {
  const fixed = [
    "Bone structure & jaw width",
    "Facial symmetry baseline",
    "Inter-ocular distance",
    "Brow ridge prominence",
  ];
  const improvable: { label: string; detail: string }[] = [
    { label: "BF% → facial sharpness", detail: "A 3–5% reduction in body fat visibly sharpens the jaw, cheekbones, and orbital area. The face is one of the first places fat loss registers." },
    { label: "Facial hair", detail: "Heavy stubble (~10 days) rates highest for both attractiveness and perceived dominance (Neave & Shields 2008). Full beard signals maturity; clean-shaven signals approachability. Optimal depends on context." },
    { label: "Skincare", detail: "Skin texture evenness is processed as a health cue. A minimal routine — SPF, retinol, hydration — addresses the main visible markers." },
    { label: "Grooming", detail: "Hair styling, brow maintenance, and overall presentation constitute the 'care signal' — indicating investment in self-presentation, itself an attractiveness cue." },
  ];

  return (
    <div className="mb-10">
      <AnnexDivider title="Facial Analysis" />
      <AnnexCard>
        <AnnexText>
          Facial attractiveness operates on two layers: the structural substrate — largely fixed — and the presentation layer, which is substantially trainable.
          Research (Langlois 1994; Rhodes 2006) shows both symmetry and averageness drive baseline facial attractiveness, but presentation variables can shift perceived attractiveness by a meaningful margin.
        </AnnexText>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* Fixed */}
          <div className="rounded-lg border border-[#e8e8e6] bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#999]">Fixed — structural</p>
            <ul className="space-y-1.5">
              {fixed.map(item => (
                <li key={item} className="flex items-start gap-2 text-[12.5px] text-[#666]">
                  <span className="mt-px text-[#ccc]">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvable */}
          <div className="rounded-lg border border-[#e8e8e6] bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#555]">Improvable — presentation</p>
            <ul className="space-y-3">
              {improvable.map(({ label, detail }) => (
                <li key={label}>
                  <p className="text-[12.5px] font-semibold text-[#222]">→ {label}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#777]">{detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AnnexCard>
    </div>
  );
}

function BehavioralAnnex() {
  const signals: { title: string; text: string }[] = [
    {
      title: "Gait & Movement",
      text: "Deliberate, unhurried movement is processed as a high-status signal within 300ms of observation (Grammer 1996). Rushed or jerky movement patterns correlate with anxiety and lower social status. Slowing down purposefully — walking at 80% of your natural pace — is one of the highest-leverage behavioral adjustments.",
    },
    {
      title: "Eye Contact",
      text: "Sustained gaze (3–5 second holds before breaking) signals social confidence and dominance. Gaze aversion — looking down or away immediately — is universally interpreted as low status. The goal is not staring but comfortable, unhurried eye contact that communicates ease.",
    },
    {
      title: "Voice",
      text: "Lower pitch and slower speech tempo are consistently associated with perceived dominance and attractiveness (Puts 2005). Resonance — chest voice vs. head voice — is the key variable, more than raw pitch. Deliberate pauses before answering also signal confidence.",
    },
    {
      title: "Spatial Behavior",
      text: "Expansive posture in social settings — wide stance, open body positioning, taking up space — activates the same dominant display cues that make PAS valuable in photos. Contracting the body (crossed arms, hunched shoulders) signals low status regardless of physique.",
    },
  ];

  return (
    <div className="mb-10">
      <AnnexDivider title="Behavioral Signals" />
      <AnnexCard>
        <AnnexText>
          Physical metrics capture the static attractiveness baseline. Dynamic signals — movement, gaze, voice, spatial behavior — are processed in real social contexts and can substantially amplify or undermine the impression created by your physique. A strong SWR with low-status behavioral signals will underperform its potential.
        </AnnexText>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {signals.map(({ title, text }) => (
            <div key={title} className="rounded-lg border border-[#e8e8e6] bg-white p-4">
              <p className="mb-2 text-[12.5px] font-semibold text-[#222]">{title}</p>
              <CitedText className="text-[12px] leading-[1.65] text-[#666]">{text}</CitedText>
            </div>
          ))}
        </div>
      </AnnexCard>
    </div>
  );
}

function LifestyleAnnex() {
  const items: { title: string; text: string }[] = [
    {
      title: "Sleep & Testosterone",
      text: "Sleeping fewer than 7 hours per night reduces testosterone levels by 10–15% (Leproult & Van Cauter 2011). Since testosterone drives the shoulder-broadening and muscle-building adaptations your protocol targets, sleep is the highest-leverage recovery variable — more impactful than any supplement.",
    },
    {
      title: "Stress & Cortisol",
      text: "Chronic stress elevates cortisol, which promotes preferential visceral fat storage around the abdomen — directly degrading your BF% score and reducing the visual contrast between waist and chest that SWR and CWR depend on. Stress management is not optional if body composition is a priority.",
    },
    {
      title: "Hydration & Presentation",
      text: "Subcutaneous water retention — driven by high sodium intake, alcohol, or chronic inflammation — blurs muscle definition by the equivalent of 1–2% BF. Day-to-day presentation can vary significantly based on these factors, independent of your actual body composition.",
    },
  ];

  return (
    <div className="mb-10">
      <AnnexDivider title="Lifestyle & Hormonal Health" />
      <AnnexCard>
        <AnnexText>
          The physical metrics in this protocol are downstream of hormonal and lifestyle variables. Training and nutrition move the numbers — but sleep, stress, and recovery determine the ceiling of what's achievable.
        </AnnexText>
        <div className="mt-5 space-y-3">
          {items.map(({ title, text }) => (
            <div key={title} className="rounded-lg border border-[#e8e8e6] bg-white p-4">
              <p className="mb-1.5 text-[12.5px] font-semibold text-[#222]">{title}</p>
              <CitedText className="text-[12px] leading-[1.65] text-[#666]">{text}</CitedText>
            </div>
          ))}
        </div>
      </AnnexCard>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */

type Props = {
  metrics:    CalibrationMetrics;
  points:     OverlayPoints | null;
  photoFront: string | null;
  photoSide:  string | null;
  heightCm?:  number;
};

function AnnotatedPhoto({ src, points, metrics, filter, caption }: {
  src:     string;
  points:  OverlayPoints | null;
  metrics: CalibrationMetrics;
  filter:  FrontFilter | "side";
  caption: string;
}) {
  return (
    <div className="mb-2">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block w-full" />
        {points && filter !== "side" && (
          <FrontOverlay points={points} metrics={metrics} filter={filter} />
        )}
        {points && filter === "side" && (
          <SideOverlay points={points} metrics={metrics} />
        )}
      </div>
      <p className="mt-2 mb-6 text-[10.5px] text-[#aaa]">{caption}</p>
    </div>
  );
}

export default function CalibrationReport({ metrics, points, photoFront, photoSide, heightCm }: Props) {
  return (
    <div className="mb-12">
      <div className="mb-8 flex items-center gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#aaa]">Detailed Analysis</p>
        <div className="h-px flex-1 bg-[#eeeeed]" />
      </div>

      {/* SWR — shoulder measurement */}
      <MetricCard metricKey="swr" value={metrics.swr} />
      {photoFront && (
        <AnnotatedPhoto src={photoFront} points={points} metrics={metrics} filter="swr" caption="Shoulder width measurement — front view" />
      )}

      {/* CWR — chest measurement */}
      <MetricCard metricKey="cwr" value={metrics.cwr} />
      {photoFront && (
        <AnnotatedPhoto src={photoFront} points={points} metrics={metrics} filter="cwr" caption="Chest width measurement — front view" />
      )}

      {/* BF% — no photo overlay */}
      <MetricCard metricKey="bf" value={metrics.bf} />

      {/* TI — waist + taper measurement */}
      <MetricCard metricKey="ti" value={metrics.ti} />
      {photoFront && (
        <AnnotatedPhoto src={photoFront} points={points} metrics={metrics} filter="ti" caption="Waist & taper measurement — front view" />
      )}

      {/* PAS — side posture measurement */}
      <div className="mb-0">
        <MetricCard metricKey="pas" value={metrics.pas} />
      </div>
      {photoSide && (
        <AnnotatedPhoto src={photoSide} points={points} metrics={metrics} filter="side" caption="Postural alignment — side view" />
      )}

      {/* PC — no photo */}
      <div className="mb-12 rounded-xl border border-[#eeeeed] bg-[#fafafa] px-5 py-1">
        <MetricCard metricKey="pc" value={metrics.pc} />
      </div>

      {/* Annexes */}
      <HeightAnnex heightCm={heightCm} />
      <FacialAnnex />
      <BehavioralAnnex />
      <LifestyleAnnex />
    </div>
  );
}

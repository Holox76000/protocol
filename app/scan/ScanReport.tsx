"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import "../program/program.css";
import "./scan.css";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Metric = {
  value: number;
  unit: string;
  label: string;
  abbr: string;
  /** Recommended range from research */
  recommended: { min: number; max: number };
  /** Source study or recommendation basis */
  source: string;
};

type Metrics = {
  swr: Metric;
  cwr: Metric;
  bf: Metric;
  pas: Metric;
  ti: Metric;
  pc: Metric;
};

type OverlayPoints = {
  shoulderLeft: { x: number; y: number };
  shoulderRight: { x: number; y: number };
  chestLeft: { x: number; y: number };
  chestRight: { x: number; y: number };
  waistLeft: { x: number; y: number };
  waistRight: { x: number; y: number };
  postureTop: { x: number; y: number };
  postureBottom: { x: number; y: number };
};

type ScanReportProps = {
  beforeImage: { src: string; alt: string };
  afterImage: { src: string; alt: string };
  metricsBefore: Metrics;
  metricsAfter: Metrics;
  overlaysBefore: OverlayPoints;
  overlaysAfter: OverlayPoints;
  subjectName: string;
  subjectAge: number;
  dark?: boolean;
  extraControls?: React.ReactNode;
};

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatValue(val: number, unit: string): string {
  if (unit === "%") return `${val}%`;
  if (unit === "/100") return `${val}`;
  return val.toFixed(2);
}

type RangeStatus = "below" | "in-range" | "above";

function getRangeStatus(value: number, rec: { min: number; max: number }, invert = false): RangeStatus {
  if (invert) {
    if (value < rec.min) return "in-range";
    if (value <= rec.max) return "in-range";
    return "above";
  }
  if (value < rec.min) return "below";
  if (value <= rec.max) return "in-range";
  return "above";
}

function rangeLabel(status: RangeStatus, abbr: string): string {
  if (status === "in-range") return "Within recommended range";
  if (status === "below") return `Below recommended ${abbr}`;
  return `Above recommended ${abbr}`;
}

const METRIC_KEYS: (keyof Metrics)[] = ["swr", "cwr", "bf", "pas", "ti", "pc"];

/* ─── Compute metrics from overlay points ───────────────────────────────── */

function computeMetricsFromPoints(points: OverlayPoints, baseMetrics: Metrics): Metrics {
  const shoulderWidth = Math.abs(points.shoulderRight.x - points.shoulderLeft.x);
  const chestWidth = Math.abs(points.chestRight.x - points.chestLeft.x);
  const waistWidth = Math.abs(points.waistRight.x - points.waistLeft.x);

  const swr = waistWidth > 0 ? +(shoulderWidth / waistWidth).toFixed(2) : 0;
  const cwr = waistWidth > 0 ? +(chestWidth / waistWidth).toFixed(2) : 0;

  const verticalDrop = Math.abs(
    ((points.waistLeft.y + points.waistRight.y) / 2) -
    ((points.shoulderLeft.y + points.shoulderRight.y) / 2)
  );
  const widthDiff = shoulderWidth - waistWidth;
  const ti = verticalDrop > 0 ? +((widthDiff / verticalDrop) * 2.5).toFixed(2) : 0;

  const postureDeviation = Math.abs(points.postureTop.x - points.postureBottom.x);
  const postureHeight = Math.abs(points.postureBottom.y - points.postureTop.y);
  const postureScore = postureHeight > 0
    ? Math.round(Math.max(0, Math.min(100, 100 - (postureDeviation / postureHeight) * 300)))
    : 50;

  const waistRatio = shoulderWidth > 0 ? waistWidth / shoulderWidth : 0.8;
  const bf = Math.round(Math.max(6, Math.min(40, waistRatio * 35)));

  const swrScore = Math.max(0, 100 - Math.abs(swr - (baseMetrics.swr.recommended.min + baseMetrics.swr.recommended.max) / 2) * 150);
  const tiScore = Math.max(0, 100 - Math.abs(ti - (baseMetrics.ti.recommended.min + baseMetrics.ti.recommended.max) / 2) * 80);
  const pc = Math.round((swrScore * 0.45 + postureScore * 0.25 + tiScore * 0.3));

  return {
    swr: { ...baseMetrics.swr, value: swr },
    cwr: { ...baseMetrics.cwr, value: cwr },
    bf: { ...baseMetrics.bf, value: bf },
    pas: { ...baseMetrics.pas, value: postureScore },
    ti: { ...baseMetrics.ti, value: ti },
    pc: { ...baseMetrics.pc, value: pc },
  };
}

const METRIC_INFO: Record<keyof Metrics, { description: string; whyItMatters: string; howWeMessure: string; recommendation: string }> = {
  swr: {
    description: "The strongest single predictor of male physical attractiveness in peer-reviewed research. Measures shoulder circumference divided by waist circumference. In a landmark study, women were shown male silhouettes with varying proportions. The factor that predicted attractiveness ratings more than any other — more than height, weight, or total muscle mass — was the ratio between shoulder width and waist width.",
    whyItMatters: "SWR drives first impressions. Humans process body shape in under 200 milliseconds — before conscious thought. A ratio in the 1.61–1.68 range triggers an involuntary perception of health, strength, and genetic fitness. This is not cultural. It holds across every population tested, from rural Cameroon to urban Tokyo. The signal is evolutionary: wide shoulders relative to a narrow waist indicate high testosterone, low cortisol, and a strong immune system. Your body broadcasts this signal to everyone you meet, whether you know it or not.",
    howWeMessure: "We measure the widest point of the deltoid on each side, then the narrowest point of the natural waist (between the lowest rib and the iliac crest). The ratio is shoulder width divided by waist width. This gives a dimensionless number that is comparable across body sizes. A man at 70kg and a man at 95kg can have the same SWR — what matters is the proportion, not the mass.",
    recommendation: "Research identifies 1.61–1.68 as the range rated most attractive across cultures and age groups. Below 1.4 indicates the shoulders are underdeveloped relative to the waist, or the waist is too wide, or both. Above 1.7 is possible but rare without very low body fat or exceptionally wide clavicles.",
  },
  cwr: {
    description: "Chest-to-waist ratio measures upper torso development relative to waist circumference. While SWR captures the overall V-shape from the back and front, CWR isolates the frontal mass of the upper body. A developed chest broadens the torso from the front view, fills out t-shirts, and creates a visual shelf above the waist that reinforces the V-taper.",
    whyItMatters: "The chest is the largest visible muscle group from the front. When underdeveloped, the torso reads as flat or narrow regardless of shoulder width. A strong CWR creates depth — the body looks three-dimensional, not just wide. In attractiveness studies, chest development was the second most-cited feature women mentioned when describing an attractive male torso (after overall shape). It also affects posture: a developed chest with balanced back muscles pulls the shoulders back naturally.",
    howWeMessure: "We measure the widest point of the ribcage at chest height (across the nipple line), then divide by the natural waist width. This is distinct from SWR because it captures torso volume, not just the shoulder-to-waist silhouette. A man can have good SWR with narrow shoulders and narrow waist, but poor CWR if his chest is flat.",
    recommendation: "A CWR between 1.35 and 1.45 indicates a well-developed chest relative to waist. Below 1.2 suggests the chest is significantly underdeveloped for the frame. Above 1.5 is achievable but requires either very developed pectorals or very low body fat.",
  },
  bf: {
    description: "Visible definition, not size, is the signal. Body fat percentage determines how your proportions are perceived. The same 80kg of lean mass looks completely different at 22% body fat versus 13%. At higher body fat, the waist widens, the SWR drops, muscle definition disappears, and the jaw line softens. At optimal body fat, every muscle is visible, the waist narrows, and the body reads as lean and athletic without being extreme.",
    whyItMatters: "Body fat is the single variable that affects every other metric simultaneously. Dropping from 22% to 14% body fat will improve your SWR (narrower waist), your CWR (chest becomes more visible), your taper index (the V-shape sharpens), your posture score (less anterior pelvic tilt from abdominal weight), and your proportion coherence (everything reads better). It is the highest-leverage variable for most men. The research is unambiguous: men in the 10-15% range are rated most attractive regardless of total muscle mass. A lean 75kg man is rated higher than a bulky 95kg man with the same SWR.",
    howWeMessure: "We estimate body fat percentage from visual indicators: the visibility of the serratus anterior, the oblique separation line, the iliac crest vascularity, and the degree of abdominal muscle definition. This is a visual estimate, not a DEXA scan. Visual BF% is what other people perceive — and perception is what drives attractiveness ratings.",
    recommendation: "Studies show 10-15% body fat is the range where proportions read as most athletic and healthy. Below 10% is achievable but difficult to sustain and may not improve attractiveness ratings (the face can look gaunt). Above 18% and muscle definition disappears, the waist widens measurably, and the body reads as softer.",
  },
  pas: {
    description: "Posture changes how your proportions are perceived without changing a single muscle. Open shoulders widen the upper body, an upright spine narrows the perceived waist, and a neutral pelvis elongates the torso. Poor posture — forward head, rounded shoulders, anterior pelvic tilt — compresses the silhouette and makes even a well-proportioned body look smaller, softer, and less confident.",
    whyItMatters: "Posture is the cheapest intervention on this list. It costs zero gym hours, zero diet changes, and zero recovery time. Yet it can shift your perceived SWR by 0.05-0.10 and your perceived height by 1-2 cm. In studies, the same person photographed with good posture versus poor posture received significantly different attractiveness and dominance ratings. Beyond perception, poor posture creates real structural problems: upper cross syndrome (tight chest + weak upper back) leads to chronic shoulder pain, neck pain, and reduced breathing capacity. Fixing posture is not cosmetic — it is functional.",
    howWeMessure: "We draw a vertical line from the tragus of the ear (the cartilage in front of the ear canal) to the greater trochanter of the hip (the bony prominence on the side of the hip). In ideal alignment, this line is perfectly vertical. Any forward deviation of the head indicates forward head posture. Any forward tilt of the pelvis indicates anterior pelvic tilt. The score is 100 minus the angular deviation, scaled so that 85-95 represents ideal alignment.",
    recommendation: "A score above 80 indicates well-aligned posture where the ear, shoulder, hip, and ankle are roughly in vertical alignment. Below 65 means measurable forward lean or shoulder rounding that is visibly affecting your silhouette. Below 50 indicates a postural pattern that is likely causing pain or movement restrictions.",
  },
  ti: {
    description: "The Taper Index measures the visual angle from your shoulders down to your waist. A steeper angle creates the V-shape that reads as athletic at a glance, even under clothes. This is distinct from SWR — you can have a good ratio but a poor taper if the shoulders and waist are at similar heights, or if the transition from wide to narrow is gradual rather than dramatic.",
    whyItMatters: "The taper is what people see from across a room. SWR is a measurement; the taper is the visual impression. A strong taper makes the body look dynamic and athletic even in a loose t-shirt or jacket. A weak taper makes the body look boxy or cylindrical. The taper is created by three things working together: wide lateral deltoids (the outer edge of the shoulder), developed lats (which create width below the armpit), and a narrow waist. The combination creates a continuous V-line from shoulder to hip that is one of the most powerful visual signals of physical fitness.",
    howWeMessure: "We measure the angle formed by the line from each shoulder to the corresponding side of the waist. A steeper angle means a more dramatic taper. The index accounts for both the width difference (shoulders vs waist) and the vertical distance between them. A short torso with a big width difference can have the same taper index as a long torso with a moderate width difference.",
    recommendation: "A taper index above 1.1 reads as athletic. Above 1.3 reads as very athletic. Below 0.8 indicates a straight or inverted silhouette where the waist is close to or wider than the shoulders. The taper is easiest to improve through lateral deltoid and lat development combined with waist reduction.",
  },
  pc: {
    description: "Proportion Coherence is the only metric that evaluates the whole picture, not isolated numbers. It measures how well your body proportions, posture, and composition work together relative to your bone structure, face shape, and age. A man with a 1.65 SWR and 12% body fat but terrible posture has poor coherence. A man with more moderate numbers but everything aligned has high coherence.",
    whyItMatters: "Attractiveness is not about individual metrics — it is about how they fit together. Research in evolutionary psychology shows that attractiveness is fundamentally about signal consistency. A lean body with rounded shoulders sends mixed signals. A muscular frame with a boyish face sends mixed signals. Coherence means every element reinforces the same message: health, strength, and genetic quality. This is why Protocol Club exists. Gym programs optimize isolated variables (bench press, squat, weight on the scale). We optimize the system. PC is the metric that captures whether the system is working.",
    howWeMessure: "PC is a weighted composite of how close each individual metric (SWR, CWR, BF%, PAS, TI) is to its recommended range, adjusted for how well they relate to each other. If your SWR is great but your posture is undermining it, the composite drops. If your BF% is high but you have wide clavicles that compensate, the composite accounts for that. It is the only metric where the target is not a fixed number — it depends on your specific body.",
    recommendation: "Above 75 indicates strong coherence where all metrics are working together. Between 50-75 means one or two variables are pulling the system down. Below 50 means significant misalignment between multiple metrics. The fastest way to improve PC is to fix whichever individual metric is furthest from its recommended range.",
  },
};

/* ─── Personalized recommendations based on current value ───────────────── */

type RecommendationTier = { title: string; actions: string[] };

function getPersonalizedRec(key: keyof Metrics, value: number): RecommendationTier {
  switch (key) {
    case "swr":
      if (value < 1.3) return {
        title: "Priority: build shoulder width",
        actions: [
          "Add lateral raises 4×15 and overhead press 4×8 three times per week.",
          "Reduce waist circumference through caloric deficit — this raises SWR faster than building muscle alone.",
          "Target the lateral deltoid specifically. Front delts are already trained in every pressing movement.",
        ],
      };
      if (value < 1.5) return {
        title: "Close — widen the gap between shoulders and waist",
        actions: [
          "Add two dedicated shoulder sessions per week. Focus on lateral raises and wide-grip upright rows.",
          "Drop body fat 3-5% to narrow waist visually. This alone can shift SWR by +0.08.",
          "Avoid heavy oblique work (side bends, weighted twists) — it thickens the waist.",
        ],
      };
      if (value < 1.61) return {
        title: "Near target — fine-tune the last 5%",
        actions: [
          "Maintain current shoulder volume. Add one finisher set of cable lateral raises per session.",
          "Focus on waist control: vacuum exercises, transverse abdominis engagement, posture.",
          "A 2-3% body fat drop may be all that's needed to cross into the recommended range.",
        ],
      };
      return {
        title: "Within recommended range — maintain",
        actions: [
          "Your SWR is in the target zone. Maintain current training volume to hold this ratio.",
          "Focus on other metrics that are further from their recommended range.",
          "Monitor waist measurements monthly. SWR can drift during bulk phases.",
        ],
      };

    case "cwr":
      if (value < 1.15) return {
        title: "Priority: build chest mass",
        actions: [
          "The chest is significantly underdeveloped relative to your waist. This flattens the upper torso from the front.",
          "Add 2 dedicated chest sessions per week: incline press 4×8, dumbbell flies 3×12, cable crossovers 3×15.",
          "Focus on the upper chest (incline work) — it creates the visual mass that reads from across a room.",
        ],
      };
      if (value < 1.3) return {
        title: "Developing — increase chest volume",
        actions: [
          "Your chest is growing but still narrow relative to your waist. Push incline pressing volume.",
          "Add dips (leaning forward) for lower chest thickness. 3×10-12 weighted.",
          "Reduce waist simultaneously — this improves CWR from both ends.",
        ],
      };
      if (value < 1.35) return {
        title: "Near target — refine chest shape",
        actions: [
          "You're close to the recommended range. Add isolation work to shape the chest.",
          "Cable flies from multiple angles (low, mid, high) to fill out the chest line.",
          "Ensure chest and shoulder work is balanced — overdeveloped front delts can mask chest width.",
        ],
      };
      return {
        title: "Within recommended range — maintain",
        actions: [
          "Your chest-to-waist ratio is in the target zone. The upper torso reads well from the front.",
          "Maintain current pressing volume. Don't neglect chest in favor of shoulders.",
          "Monitor waist measurements — waist gain erases CWR progress the same way it erases SWR.",
        ],
      };

    case "bf":
      if (value > 25) return {
        title: "Priority: reduce body fat to reveal proportions",
        actions: [
          "A moderate caloric deficit (300-500 kcal/day) is more sustainable than aggressive cuts.",
          "Keep protein at 1.6-2.2g/kg bodyweight to preserve muscle while losing fat.",
          "Every 1% body fat lost makes your existing muscle more visible and your SWR sharper.",
        ],
      };
      if (value > 18) return {
        title: "Recomp zone — lean out while preserving muscle",
        actions: [
          "You're in the range where body recomposition works. Slight deficit + high protein.",
          "Prioritize sleep (7-9h) and stress management — cortisol drives abdominal fat storage.",
          "Add 2-3 sessions of low-intensity cardio (walking, cycling) per week. Not HIIT.",
        ],
      };
      if (value > 15) return {
        title: "Close to target — precision phase",
        actions: [
          "Reduce deficit to 200-300 kcal/day. Slower but preserves more muscle definition.",
          "Track waist measurement weekly rather than scale weight. The scale lies at this stage.",
          "Consider carb cycling: higher on training days, lower on rest days.",
        ],
      };
      return {
        title: "Within recommended range — maintain",
        actions: [
          "Your body fat is in the optimal range for proportional attractiveness.",
          "Eat at maintenance. Muscle gain at this body fat level improves every other metric.",
          "If below 10%, consider whether this is sustainable long-term for your health.",
        ],
      };

    case "pas":
      if (value < 50) return {
        title: "Priority: correct postural imbalances",
        actions: [
          "Address forward head posture: chin tucks 3×15 daily, reduce screen time in slouched positions.",
          "Strengthen upper back with face pulls 3×20 and band pull-aparts every training session.",
          "Stretch chest and hip flexors daily — tight pecs and psoas pull the shoulders and pelvis forward.",
        ],
      };
      if (value < 70) return {
        title: "Moderate correction needed",
        actions: [
          "Add wall slides and thoracic spine extensions to your warm-up routine.",
          "Strengthen the posterior chain: rows, reverse flies, glute bridges. Weak back = rounded shoulders.",
          "Set a phone reminder every 2 hours to check posture. Awareness is half the fix.",
        ],
      };
      if (value < 80) return {
        title: "Minor adjustments — posture is functional but not optimal",
        actions: [
          "Fine-tune with dead hangs (30-60s) and farmer's carries to reinforce upright posture under load.",
          "Focus on scapular retraction cues during all pulling movements.",
          "Consider a standing desk or ergonomic setup if you sit 6+ hours daily.",
        ],
      };
      return {
        title: "Good posture — maintain awareness",
        actions: [
          "Your alignment is within the recommended range. Keep doing what you're doing.",
          "Maintain mobility work to prevent regression. Posture is use-it-or-lose-it.",
          "Good posture is improving your SWR for free — your shoulders read wider than they measure.",
        ],
      };

    case "ti":
      if (value < 0.6) return {
        title: "Priority: create the V-taper",
        actions: [
          "Your torso reads as straight or inverted. Shoulder width is the fastest lever.",
          "Prioritize lat development: pull-ups, lat pulldowns, wide-grip rows. Lats create taper from the back.",
          "Reduce waist simultaneously — the taper is a ratio, both ends matter.",
        ],
      };
      if (value < 0.9) return {
        title: "Building taper — keep pushing shoulders and lats",
        actions: [
          "Add lat-focused supersets: wide-grip pulldown + straight-arm pulldown, 3 rounds.",
          "Train shoulders 3×/week minimum. Lateral deltoid is the key muscle for visual width.",
          "Avoid bulking too aggressively — waist gains erase taper gains.",
        ],
      };
      if (value < 1.1) return {
        title: "Approaching athletic range",
        actions: [
          "Continue shoulder and lat work. You're close to the athletic threshold.",
          "Focus on waist control: vacuum exercises, anti-rotation core work, avoid heavy oblique loading.",
          "A 2-3% body fat cut at this stage will amplify the taper significantly.",
        ],
      };
      return {
        title: "Athletic taper — maintain and refine",
        actions: [
          "Your V-taper is in the athletic range. This reads well in and out of clothes.",
          "Maintain lat and shoulder volume. Taper is easy to build and easy to lose.",
          "Focus on other metrics — TI is your strength.",
        ],
      };

    case "pc":
      if (value < 40) return {
        title: "Low coherence — body and frame are mismatched",
        actions: [
          "Your proportions are significantly off from what your bone structure and face suggest.",
          "Focus on the metric furthest from its recommended range first — it's dragging PC down.",
          "Body recomposition (less fat, more muscle in the right places) is the fastest path to coherence.",
        ],
      };
      if (value < 60) return {
        title: "Moderate coherence — clear room for improvement",
        actions: [
          "Two or more metrics are pulling your coherence down. Address them in priority order.",
          "SWR and BF% have the highest impact on PC. Fix those first.",
          "Posture is the lowest-effort improvement — it shifts PC without changing body composition.",
        ],
      };
      if (value < 75) return {
        title: "Improving — one or two variables left to optimize",
        actions: [
          "You're getting close. Identify which single metric is furthest from its target.",
          "At this level, small changes compound. A 2% BF drop + better posture can push PC above 75.",
          "Consider how your training aligns with your frame. Not every body needs the same protocol.",
        ],
      };
      return {
        title: "Strong coherence — your body reads well as a whole",
        actions: [
          "Your proportions, posture, and composition are aligned with your frame.",
          "Maintain current protocol. Focus on consistency over intensity.",
          "This is the goal — a body that looks right, not just big.",
        ],
      };
  }
}

/* ─── SVG Overlay (draggable ranges) ────────────────────────────────────── */

type DragTarget =
  | "shoulder-left" | "shoulder-right" | "shoulder-band"
  | "chest-left" | "chest-right" | "chest-band"
  | "waist-left" | "waist-right" | "waist-band"
  | "posture-top" | "posture-bottom" | "posture-band";

const BAND_HEIGHT = 6; // height of horizontal bands in SVG units
const BAND_WIDTH = 3;  // width of vertical posture band

function MeasurementOverlay({
  points,
  scanned,
  onPointsChange,
}: {
  points: OverlayPoints;
  scanned: boolean;
  onPointsChange?: (updated: OverlayPoints) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<DragTarget | null>(null);
  const dragStart = useRef<{ x: number; y: number; pts: OverlayPoints } | null>(null);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * 100,
      y: (clientY - rect.top) / rect.height * 100,
    };
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const handlePointerDown = useCallback((target: DragTarget) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragging.current = target;
    const coords = toSvgCoords(e.clientX, e.clientY);
    if (coords) dragStart.current = { x: coords.x, y: coords.y, pts: JSON.parse(JSON.stringify(points)) };
  }, [points, toSvgCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const target = dragging.current;
    const start = dragStart.current;
    if (!target || !start || !onPointsChange) return;
    const coords = toSvgCoords(e.clientX, e.clientY);
    if (!coords) return;

    const dx = coords.x - start.x;
    const dy = coords.y - start.y;
    const p = start.pts;

    switch (target) {
      case "shoulder-left":
        onPointsChange({ ...points, shoulderLeft: { x: clamp(p.shoulderLeft.x + dx), y: clamp(p.shoulderLeft.y + dy) } });
        return;
      case "shoulder-right":
        onPointsChange({ ...points, shoulderRight: { x: clamp(p.shoulderRight.x + dx), y: clamp(p.shoulderRight.y + dy) } });
        return;
      case "shoulder-band":
        onPointsChange({
          ...points,
          shoulderLeft: { x: clamp(p.shoulderLeft.x + dx), y: clamp(p.shoulderLeft.y + dy) },
          shoulderRight: { x: clamp(p.shoulderRight.x + dx), y: clamp(p.shoulderRight.y + dy) },
        });
        return;
      case "chest-left":
        onPointsChange({ ...points, chestLeft: { x: clamp(p.chestLeft.x + dx), y: clamp(p.chestLeft.y + dy) } });
        return;
      case "chest-right":
        onPointsChange({ ...points, chestRight: { x: clamp(p.chestRight.x + dx), y: clamp(p.chestRight.y + dy) } });
        return;
      case "chest-band":
        onPointsChange({
          ...points,
          chestLeft: { x: clamp(p.chestLeft.x + dx), y: clamp(p.chestLeft.y + dy) },
          chestRight: { x: clamp(p.chestRight.x + dx), y: clamp(p.chestRight.y + dy) },
        });
        return;
      case "waist-left":
        onPointsChange({ ...points, waistLeft: { x: clamp(p.waistLeft.x + dx), y: clamp(p.waistLeft.y + dy) } });
        return;
      case "waist-right":
        onPointsChange({ ...points, waistRight: { x: clamp(p.waistRight.x + dx), y: clamp(p.waistRight.y + dy) } });
        return;
      case "waist-band":
        onPointsChange({
          ...points,
          waistLeft: { x: clamp(p.waistLeft.x + dx), y: clamp(p.waistLeft.y + dy) },
          waistRight: { x: clamp(p.waistRight.x + dx), y: clamp(p.waistRight.y + dy) },
        });
        return;
      case "posture-top":
        onPointsChange({ ...points, postureTop: { x: clamp(p.postureTop.x + dx), y: clamp(p.postureTop.y + dy) } });
        return;
      case "posture-bottom":
        onPointsChange({ ...points, postureBottom: { x: clamp(p.postureBottom.x + dx), y: clamp(p.postureBottom.y + dy) } });
        return;
      case "posture-band":
        onPointsChange({
          ...points,
          postureTop: { x: clamp(p.postureTop.x + dx), y: clamp(p.postureTop.y + dy) },
          postureBottom: { x: clamp(p.postureBottom.x + dx), y: clamp(p.postureBottom.y + dy) },
        });
        return;
    }
  }, [points, onPointsChange, toSvgCoords]);

  const handlePointerUp = useCallback(() => {
    if (dragging.current && onPointsChange) {
      console.log("📍 Overlay positions:", JSON.stringify(points, null, 2));
    }
    dragging.current = null;
    dragStart.current = null;
  }, [points, onPointsChange]);

  const hR = 0.8;    // handle visible radius (small, precise)
  const hitR = 3;    // handle hit area radius
  const bh = BAND_HEIGHT;
  const bw = BAND_WIDTH;

  const shoulderY = (points.shoulderLeft.y + points.shoulderRight.y) / 2;
  const chestY = (points.chestLeft.y + points.chestRight.y) / 2;
  const waistY = (points.waistLeft.y + points.waistRight.y) / 2;

  // Inline metric computation for overlay labels
  const _sw = points.shoulderRight.x - points.shoulderLeft.x;
  const _cw = points.chestRight.x - points.chestLeft.x;
  const _ww = points.waistRight.x - points.waistLeft.x;
  const _vd = Math.abs(((points.waistLeft.y + points.waistRight.y) / 2) - ((points.shoulderLeft.y + points.shoulderRight.y) / 2));
  const swrVal = _ww > 0 ? (_sw / _ww).toFixed(2) : "—";
  const cwrVal = _ww > 0 ? (_cw / _ww).toFixed(2) : "—";
  const tiVal  = _vd > 0 ? ((_sw - _ww) / _vd * 2.5).toFixed(2) : "—";

  return (
    <svg
      ref={svgRef}
      className={`scan-overlay ${scanned ? "scan-overlay--visible" : ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* ── Taper lines (background) ── */}
      <line x1={points.shoulderLeft.x} y1={points.shoulderLeft.y} x2={points.waistLeft.x} y2={points.waistLeft.y} className="scan-overlay__line scan-overlay__line--taper" strokeDasharray="1.5 1" />
      <line x1={points.shoulderRight.x} y1={points.shoulderRight.y} x2={points.waistRight.x} y2={points.waistRight.y} className="scan-overlay__line scan-overlay__line--taper" strokeDasharray="1.5 1" />

      {/* ── Shoulder band ── */}
      <g>
        {/* Band fill */}
        <rect
          x={points.shoulderLeft.x} y={shoulderY - bh / 2}
          width={points.shoulderRight.x - points.shoulderLeft.x} height={bh}
          className="scan-band scan-band--shoulder"
          style={{ cursor: "move", pointerEvents: "fill" }}
          onPointerDown={handlePointerDown("shoulder-band")}
        />
        {/* Center line */}
        <line x1={points.shoulderLeft.x} y1={shoulderY} x2={points.shoulderRight.x} y2={shoulderY} className="scan-overlay__line scan-overlay__line--shoulder" />
        {/* Label */}
        <text x={(points.shoulderLeft.x + points.shoulderRight.x) / 2} y={shoulderY - bh / 2 - 2.8} className="scan-overlay__label">SHOULDERS</text>
        {/* Metric value */}
        <text x={(points.shoulderLeft.x + points.shoulderRight.x) / 2} y={shoulderY - bh / 2 - 1.0} className="scan-overlay__metric-value">SWR {swrVal}</text>
        {/* Left handle */}
        <rect x={points.shoulderLeft.x - 1} y={shoulderY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.shoulderLeft.x - hitR / 2} y={shoulderY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("shoulder-left")} />
        {/* Right handle */}
        <rect x={points.shoulderRight.x - 1} y={shoulderY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.shoulderRight.x - hitR / 2} y={shoulderY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("shoulder-right")} />
      </g>

      {/* ── Chest band ── */}
      <g>
        <rect
          x={points.chestLeft.x} y={chestY - bh / 2}
          width={points.chestRight.x - points.chestLeft.x} height={bh}
          className="scan-band scan-band--chest"
          style={{ cursor: "move", pointerEvents: "fill" }}
          onPointerDown={handlePointerDown("chest-band")}
        />
        <line x1={points.chestLeft.x} y1={chestY} x2={points.chestRight.x} y2={chestY} className="scan-overlay__line scan-overlay__line--chest" />
        <text x={(points.chestLeft.x + points.chestRight.x) / 2} y={chestY - bh / 2 - 2.8} className="scan-overlay__label">CHEST</text>
        <text x={(points.chestLeft.x + points.chestRight.x) / 2} y={chestY - bh / 2 - 1.0} className="scan-overlay__metric-value">CWR {cwrVal}</text>
        <rect x={points.chestLeft.x - 1} y={chestY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.chestLeft.x - hitR / 2} y={chestY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("chest-left")} />
        <rect x={points.chestRight.x - 1} y={chestY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.chestRight.x - hitR / 2} y={chestY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("chest-right")} />
      </g>

      {/* ── Waist band ── */}
      <g>
        <rect
          x={points.waistLeft.x} y={waistY - bh / 2}
          width={points.waistRight.x - points.waistLeft.x} height={bh}
          className="scan-band scan-band--waist"
          style={{ cursor: "move", pointerEvents: "fill" }}
          onPointerDown={handlePointerDown("waist-band")}
        />
        <line x1={points.waistLeft.x} y1={waistY} x2={points.waistRight.x} y2={waistY} className="scan-overlay__line scan-overlay__line--waist" />
        <text x={(points.waistLeft.x + points.waistRight.x) / 2} y={waistY + bh / 2 + 2.8} className="scan-overlay__label">WAIST</text>
        <text x={(points.waistLeft.x + points.waistRight.x) / 2} y={waistY + bh / 2 + 4.5} className="scan-overlay__metric-value">TI {tiVal}</text>
        <rect x={points.waistLeft.x - 1} y={waistY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.waistLeft.x - hitR / 2} y={waistY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("waist-left")} />
        <rect x={points.waistRight.x - 1} y={waistY - bh / 2} width={2} height={bh} className="scan-band__handle" />
        <rect x={points.waistRight.x - hitR / 2} y={waistY - bh} width={hitR} height={bh * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={handlePointerDown("waist-right")} />
      </g>

      {/* ── Posture band ── */}
      <g>
        {/* Vertical band fill */}
        <rect
          x={Math.min(points.postureTop.x, points.postureBottom.x) - bw / 2}
          y={points.postureTop.y}
          width={Math.abs(points.postureBottom.x - points.postureTop.x) + bw}
          height={points.postureBottom.y - points.postureTop.y}
          className="scan-band scan-band--posture"
          style={{ cursor: "move", pointerEvents: "fill" }}
          onPointerDown={handlePointerDown("posture-band")}
        />
        <line x1={points.postureTop.x} y1={points.postureTop.y} x2={points.postureBottom.x} y2={points.postureBottom.y} className="scan-overlay__line scan-overlay__line--posture" strokeDasharray="2 1.5" />
        <text x={Math.max(points.postureTop.x, points.postureBottom.x) + bw / 2 + 2} y={points.postureTop.y + 3} className="scan-overlay__label" style={{ textAnchor: "start" }}>POSTURE</text>
        {/* Top handle */}
        <circle cx={points.postureTop.x} cy={points.postureTop.y} r={hR} className="scan-overlay__dot" style={{ pointerEvents: "none" }} />
        <circle cx={points.postureTop.x} cy={points.postureTop.y} r={hitR} fill="transparent" style={{ cursor: "ns-resize", pointerEvents: "all" }} onPointerDown={handlePointerDown("posture-top")} />
        {/* Bottom handle */}
        <circle cx={points.postureBottom.x} cy={points.postureBottom.y} r={hR} className="scan-overlay__dot" style={{ pointerEvents: "none" }} />
        <circle cx={points.postureBottom.x} cy={points.postureBottom.y} r={hitR} fill="transparent" style={{ cursor: "ns-resize", pointerEvents: "all" }} onPointerDown={handlePointerDown("posture-bottom")} />
      </g>
    </svg>
  );
}

/* ─── Scan Line Animation ───────────────────────────────────────────────── */

function ScanLine({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="scan-line" />;
}

/* ─── Body zone crops per metric ─────────────────────────────────────────── */

/** Default crop center + zoom per metric (used as initial state) */
const METRIC_CROP_DEFAULTS: Record<keyof Metrics, { cx: number; cy: number; zoom: number; label: string }> = {
  swr: { cx: 50, cy: 28, zoom: 2.2, label: "Shoulder width" },
  cwr: { cx: 50, cy: 38, zoom: 2.2, label: "Chest width" },
  bf: { cx: 50, cy: 52, zoom: 2.5, label: "Midsection" },
  pas: { cx: 50, cy: 35, zoom: 1.3, label: "Full posture" },
  ti: { cx: 50, cy: 40, zoom: 1.6, label: "V-taper zone" },
  pc: { cx: 50, cy: 30, zoom: 1.1, label: "Full proportions" },
};

/* ─── Export helper ─────────────────────────────────────────────────────── */

async function exportSvgCrop(src: string, viewBox: string, overlayEl: SVGSVGElement | null, filename: string) {
  let dataUrl = src;
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { /* fallback to original src */ }

  const styles = `
    .scan-crop-overlay__line { fill: none; stroke-width: 0.5; stroke-linecap: round; }
    .scan-crop-overlay__line--shoulder { stroke: rgba(120,230,160,0.95); }
    .scan-crop-overlay__line--chest { stroke: rgba(200,160,250,0.95); }
    .scan-crop-overlay__line--waist { stroke: rgba(240,190,90,0.95); }
    .scan-crop-overlay__line--taper { stroke: rgba(120,230,160,0.6); stroke-width: 0.35; }
    .scan-crop-overlay__line--posture { stroke: rgba(160,180,240,0.85); stroke-width: 0.4; }
    .scan-crop-overlay__dot { fill: rgba(255,255,255,1); stroke: rgba(120,230,160,1); stroke-width: 0.3; }
    .scan-crop-overlay__label { font-size: 2.5px; fill: rgba(255,255,255,0.95); text-anchor: middle; font-weight: 700; letter-spacing: 0.4px; }
    .scan-crop-overlay__metric-value { font-size: 2.2px; font-family: monospace; font-weight: 700; fill: rgba(255,255,255,0.9); text-anchor: middle; }
  `;

  const overlayInner = overlayEl?.innerHTML ?? "";
  const [, , visW, visH] = viewBox.split(" ").map(Number);
  const exportW = 1200;
  const exportH = Math.round(exportW * (visH / visW));

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${exportW}" height="${exportH}" preserveAspectRatio="xMidYMid slice">
    <defs><style>${styles}</style></defs>
    <image href="${dataUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice"/>
    ${overlayInner}
  </svg>`;

  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = document.createElement("img");
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = exportW;
    canvas.height = exportH;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    URL.revokeObjectURL(svgUrl);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  img.onerror = () => URL.revokeObjectURL(svgUrl);
  img.src = svgUrl;
}

/* ─── Pannable + Zoomable image crop ────────────────────────────────────── */

function PannableCrop({
  src,
  alt,
  defaultCx,
  defaultCy,
  defaultZoom,
  children,
  exportFilename,
}: {
  src: string;
  alt: string;
  defaultCx: number;
  defaultCy: number;
  defaultZoom: number;
  children?: React.ReactNode;
  exportFilename?: string;
}) {
  const [cx, setCx] = useState(defaultCx);
  const [cy, setCy] = useState(defaultCy);
  const [zoom, setZoom] = useState(defaultZoom);
  const frameRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const viewBoxRef = useRef("");
  const panStart = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    panStart.current = { x: e.clientX, y: e.clientY, cx, cy };
  }, [cx, cy]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panStart.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    // Convert pixel movement to % of image, scaled by zoom
    const dx = ((e.clientX - panStart.current.x) / rect.width) * (100 / zoom);
    const dy = ((e.clientY - panStart.current.y) / rect.height) * (100 / zoom);
    setCx(Math.max(0, Math.min(100, panStart.current.cx - dx)));
    setCy(Math.max(0, Math.min(100, panStart.current.cy - dy)));
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    panStart.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.max(1, Math.min(5, z + delta)));
  }, []);

  // Compute viewBox from center + zoom (image coords 0-100, square source)
  const frameAspect = 3 / 4;
  const visW = (frameAspect * 100) / zoom;
  const visH = 100 / zoom;
  const vbX = cx - visW / 2;
  const vbY = cy - visH / 2;
  const viewBox = `${vbX} ${vbY} ${visW} ${visH}`;
  viewBoxRef.current = viewBox;

  const handleExport = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await exportSvgCrop(src, viewBoxRef.current, overlayRef.current, exportFilename ?? "scan-export.png");
  }, [src, exportFilename]);

  return (
    <div
      ref={frameRef}
      className="scan-metric__crop-frame"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ touchAction: "none", cursor: panStart.current ? "grabbing" : "grab" }}
    >
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" className="scan-crop-svg">
        <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
      </svg>
      {/* Overlay lines use the same viewBox */}
      {children && (
        <svg ref={overlayRef} viewBox={viewBox} preserveAspectRatio="xMidYMid slice" className="scan-crop-overlay">
          {children}
        </svg>
      )}
      {exportFilename && (
        <button className="scan-crop__export-btn" onClick={handleExport} title="Exporter l'image">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      <div className="scan-crop-zoom-hint">
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

/** Inline SVG lines for a metric's crop — rendered as children of PannableCrop */
function CropLines({ metricKey, points }: { metricKey: keyof Metrics; points: OverlayPoints }) {
  const sl = points.shoulderLeft;
  const sr = points.shoulderRight;
  const cl = points.chestLeft;
  const cr = points.chestRight;
  const wl = points.waistLeft;
  const wr = points.waistRight;
  const pt = points.postureTop;
  const pb = points.postureBottom;
  const dotR = 0.6;

  const _sw = sr.x - sl.x;
  const _cw = cr.x - cl.x;
  const _ww = wr.x - wl.x;
  const _vd = Math.abs(((wl.y + wr.y) / 2) - ((sl.y + sr.y) / 2));
  const swrVal = _ww > 0 ? (_sw / _ww).toFixed(2) : "—";
  const cwrVal = _ww > 0 ? (_cw / _ww).toFixed(2) : "—";
  const tiVal  = _vd > 0 ? ((_sw - _ww) / _vd * 2.5).toFixed(2) : "—";

  return (
    <>
      {(metricKey === "swr" || metricKey === "pc") && (
        <>
          <line x1={sl.x} y1={sl.y} x2={sr.x} y2={sr.y} className="scan-crop-overlay__line scan-crop-overlay__line--shoulder" />
          <circle cx={sl.x} cy={sl.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={sr.x} cy={sr.y} r={dotR} className="scan-crop-overlay__dot" />
          {metricKey === "swr" && <>
            <text x={(sl.x + sr.x) / 2} y={sl.y - 3} className="scan-crop-overlay__label">SWR</text>
            <text x={(sl.x + sr.x) / 2} y={sl.y - 1.2} className="scan-crop-overlay__metric-value">{swrVal}</text>
          </>}
        </>
      )}
      {(metricKey === "cwr" || metricKey === "pc") && (
        <>
          <line x1={cl.x} y1={cl.y} x2={cr.x} y2={cr.y} className="scan-crop-overlay__line scan-crop-overlay__line--chest" />
          <line x1={wl.x} y1={wl.y} x2={wr.x} y2={wr.y} className="scan-crop-overlay__line scan-crop-overlay__line--waist" />
          <circle cx={cl.x} cy={cl.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={cr.x} cy={cr.y} r={dotR} className="scan-crop-overlay__dot" />
          {metricKey === "cwr" && <>
            <text x={(cl.x + cr.x) / 2} y={cl.y - 3} className="scan-crop-overlay__label">CHEST</text>
            <text x={(cl.x + cr.x) / 2} y={cl.y - 1.2} className="scan-crop-overlay__metric-value">{cwrVal}</text>
          </>}
        </>
      )}
      {(metricKey === "bf" || metricKey === "pc") && (
        <>
          <line x1={wl.x} y1={wl.y} x2={wr.x} y2={wr.y} className="scan-crop-overlay__line scan-crop-overlay__line--waist" />
          <circle cx={wl.x} cy={wl.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={wr.x} cy={wr.y} r={dotR} className="scan-crop-overlay__dot" />
          <text x={(wl.x + wr.x) / 2} y={wl.y + 3.5} className="scan-crop-overlay__label">WAIST</text>
        </>
      )}
      {(metricKey === "pas" || metricKey === "pc") && (
        <line x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y} className="scan-crop-overlay__line scan-crop-overlay__line--posture" strokeDasharray="3 2" />
      )}
      {(metricKey === "ti" || metricKey === "pc") && (
        <>
          <line x1={sl.x} y1={sl.y} x2={sr.x} y2={sr.y} className="scan-crop-overlay__line scan-crop-overlay__line--shoulder" />
          <line x1={cl.x} y1={cl.y} x2={cr.x} y2={cr.y} className="scan-crop-overlay__line scan-crop-overlay__line--chest" />
          <line x1={wl.x} y1={wl.y} x2={wr.x} y2={wr.y} className="scan-crop-overlay__line scan-crop-overlay__line--waist" />
          <line x1={sl.x} y1={sl.y} x2={wl.x} y2={wl.y} className="scan-crop-overlay__line scan-crop-overlay__line--taper" strokeDasharray="2 1.5" />
          <line x1={sr.x} y1={sr.y} x2={wr.x} y2={wr.y} className="scan-crop-overlay__line scan-crop-overlay__line--taper" strokeDasharray="2 1.5" />
          <circle cx={sl.x} cy={sl.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={sr.x} cy={sr.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={wl.x} cy={wl.y} r={dotR} className="scan-crop-overlay__dot" />
          <circle cx={wr.x} cy={wr.y} r={dotR} className="scan-crop-overlay__dot" />
          {metricKey === "ti" && <>
            <text x={(sl.x + sr.x) / 2} y={sl.y - 3} className="scan-crop-overlay__label">TI</text>
            <text x={(sl.x + sr.x) / 2} y={sl.y - 1.2} className="scan-crop-overlay__metric-value">{tiVal}</text>
          </>}
        </>
      )}
      {/* ── pc: all annotations, non-overlapping layout ── */}
      {metricKey === "pc" && <>
        {/* SWR — above shoulder line, left side */}
        <text x={sl.x + 1} y={sl.y - 3} className="scan-crop-overlay__label" textAnchor="start">SWR</text>
        <text x={sl.x + 1} y={sl.y - 1.2} className="scan-crop-overlay__metric-value" textAnchor="start">{swrVal}</text>
        {/* CWR — above chest line, right side */}
        <text x={cr.x - 1} y={cl.y - 3} className="scan-crop-overlay__label" textAnchor="end">CWR</text>
        <text x={cr.x - 1} y={cl.y - 1.2} className="scan-crop-overlay__metric-value" textAnchor="end">{cwrVal}</text>
        {/* TI — below waist line, centered */}
        <text x={(wl.x + wr.x) / 2} y={(wl.y + wr.y) / 2 + 9} className="scan-crop-overlay__label">TI</text>
        <text x={(wl.x + wr.x) / 2} y={(wl.y + wr.y) / 2 + 11} className="scan-crop-overlay__metric-value">{tiVal}</text>
      </>}
    </>
  );
}

/* ─── Metric Card (full-width with body crop) ───────────────────────────── */

function MetricSection({
  metric,
  metricKey,
  index,
  scanned,
  beforeSrc,
  afterSrc,
  points,
  pointsAfter,
}: {
  metric: Metric;
  metricKey: keyof Metrics;
  index: number;
  scanned: boolean;
  beforeSrc: string;
  afterSrc: string;
  points: OverlayPoints;
  pointsAfter: OverlayPoints;
}) {
  const info = METRIC_INFO[metricKey];
  const cropDef = METRIC_CROP_DEFAULTS[metricKey];
  const rec = getPersonalizedRec(metricKey, metric.value);
  const isBfMetric = metricKey === "bf";
  const status = isBfMetric
    ? (metric.value > metric.recommended.max ? "above" as RangeStatus : metric.value >= metric.recommended.min ? "in-range" as RangeStatus : "in-range" as RangeStatus)
    : getRangeStatus(metric.value, metric.recommended);
  const statusLabel = rangeLabel(status, metric.abbr);

  const rangeScale = metricKey === "bf" ? { min: 5, max: 40 }
    : metricKey === "pas" || metricKey === "pc" ? { min: 0, max: 100 }
    : metricKey === "swr" ? { min: 0.9, max: 2.0 }
    : metricKey === "cwr" ? { min: 0.9, max: 1.8 }
    : { min: 0, max: 2.0 };

  const toPercent = (v: number) => Math.max(0, Math.min(100, ((v - rangeScale.min) / (rangeScale.max - rangeScale.min)) * 100));
  const recLeft = toPercent(metric.recommended.min);
  const recRight = toPercent(metric.recommended.max);
  const valuePos = toPercent(metric.value);

  return (
    <section
      className={`scan-card ${scanned ? "scan-card--visible" : ""}`}
      style={{ transitionDelay: `${0.6 + index * 0.15}s` }}
    >
      <div className="scan-card__inner">
        {/* ── Page title ── */}
        <header className="scan-card__title-block">
          <h2 className="scan-card__name">{metric.label}</h2>
          <p className="scan-card__subtitle">Recommendations</p>
        </header>

        {/* ── Two-column: text left, analysis image right ── */}
        <div className="scan-card__analysis">
          <div className="scan-card__text">
            <h3 className="scan-card__section-title">What we found</h3>
            <p className="scan-card__desc">{info.description}</p>

            <div className="scan-card__value-row">
              <span className="scan-card__value">{formatValue(metric.value, metric.unit)}</span>
              <span className={`scan-card__status scan-card__status--${status}`}>{statusLabel}</span>
            </div>

            <div className="scan-card__range">
              <div className="scan-card__range-labels">
                <span>Current</span>
                <span>Recommended: {formatValue(metric.recommended.min, metric.unit)} – {formatValue(metric.recommended.max, metric.unit)}</span>
              </div>
              <div className="scan-card__range-track">
                <div className="scan-card__range-zone" style={{ left: `${recLeft}%`, width: `${recRight - recLeft}%` }} />
                <div className={`scan-card__range-marker scan-card__range-marker--${status}`} style={{ left: scanned ? `${valuePos}%` : "0%" }} />
              </div>
            </div>

            <p className="scan-card__rec-target">{info.recommendation}</p>
          </div>

        </div>

        {/* ── Before / After row ── */}
        <div className="scan-card__compare">
          <div className="scan-card__compare-item">
            <span className="scan-card__compare-label">Before</span>
            <PannableCrop src={beforeSrc} alt="Before" defaultCx={cropDef.cx} defaultCy={cropDef.cy} defaultZoom={cropDef.zoom} exportFilename={`scan-${metricKey}-before.png`}>
              <CropLines metricKey={metricKey} points={points} />
            </PannableCrop>
          </div>
          <div className="scan-card__compare-item">
            <span className="scan-card__compare-label">After</span>
            <PannableCrop src={afterSrc} alt="After" defaultCx={cropDef.cx} defaultCy={cropDef.cy} defaultZoom={cropDef.zoom} exportFilename={`scan-${metricKey}-after.png`}>
              <CropLines metricKey={metricKey} points={pointsAfter} />
            </PannableCrop>
          </div>
        </div>

        {/* ── Why it matters ── */}
        <div className="scan-card__detail-section">
          <h3 className="scan-card__section-title">Why it matters</h3>
          <p className="scan-card__desc">{info.whyItMatters}</p>
        </div>

        {/* ── How we measure ── */}
        <div className="scan-card__detail-section">
          <h3 className="scan-card__section-title">How we measure</h3>
          <p className="scan-card__desc">{info.howWeMessure}</p>
        </div>

        {/* ── Recommendations list ── */}
        <div className="scan-card__rec">
          <h3 className="scan-card__section-title">{rec.title}</h3>
          <ul className="scan-card__rec-list">
            {rec.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>

        {/* ── Summary card ── */}
        <div className="scan-card__summary">
          <div className="scan-card__summary-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L11 7H16L12 10.5L13.5 16L9 12.5L4.5 16L6 10.5L2 7H7L9 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          </div>
          <div className="scan-card__summary-content">
            <p className="scan-card__summary-title">{metric.label} Summary</p>
            <p className="scan-card__summary-text">{rec.actions[0]}</p>
          </div>
        </div>

        <p className="scan-card__cite">{metric.source}</p>
      </div>
    </section>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function ScanReport({
  beforeImage,
  afterImage,
  metricsBefore,
  metricsAfter,
  overlaysBefore,
  overlaysAfter,
  subjectName,
  subjectAge,
  dark = false,
  extraControls,
}: ScanReportProps) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showAfter, setShowAfter] = useState(false);
  const [beforePts, setBeforePts] = useState(overlaysBefore);
  const [afterPts, setAfterPts] = useState(overlaysAfter);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const storageKey = `scan-config-${subjectName}`;

  // Load saved config on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { beforePts: bp, afterPts: ap } = JSON.parse(raw);
        if (bp) setBeforePts(bp);
        if (ap) setAfterPts(ap);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on every change (debounced 600ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ beforePts, afterPts, savedAt: new Date().toISOString() }));
        setSavedAt(new Date());
      } catch { /* ignore */ }
    }, 600);
    return () => clearTimeout(timer);
  }, [storageKey, beforePts, afterPts]);

  const handleReset = useCallback(() => {
    setBeforePts(overlaysBefore);
    setAfterPts(overlaysAfter);
    localStorage.removeItem(storageKey);
    setSavedAt(null);
  }, [overlaysBefore, overlaysAfter, storageKey]);

  useEffect(() => {
    const t1 = setTimeout(() => setScanning(true), 300);
    const t2 = setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const currentImage = showAfter ? afterImage : beforeImage;
  const baseMetrics = showAfter ? metricsAfter : metricsBefore;
  const currentOverlays = showAfter ? afterPts : beforePts;
  const setCurrentOverlays = showAfter ? setAfterPts : setBeforePts;
  const currentMetrics = computeMetricsFromPoints(currentOverlays, baseMetrics);

  return (
    <div className={`program-page program-page--theme-test scan-page ${dark ? "scan-page--dark" : ""}`}>
      {/* ── Header ── */}
      <header className="scan-header">
        <div className="scan-header__inner">
          <div className="scan-header__brand">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={36}
              height={36}
              className="scan-header__logo"
            />
            <span className="scan-header__title">AI Body Scan</span>
          </div>
          {extraControls}
          <div className="scan-header__config">
            {savedAt && (
              <span className="scan-config__saved-badge">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sauvegardé {savedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button className="scan-config__reset-btn" onClick={handleReset} title="Réinitialiser les bandes">
              Réinit.
            </button>
          </div>
          <span className={`scan-toggle ${showAfter ? "scan-toggle--after" : ""}`}>
            <button
              type="button"
              className={`scan-toggle__btn ${!showAfter ? "scan-toggle__btn--active" : ""}`}
              onClick={() => setShowAfter(false)}
            >
              Before
            </button>
            <button
              type="button"
              className={`scan-toggle__btn ${showAfter ? "scan-toggle__btn--active" : ""}`}
              onClick={() => setShowAfter(true)}
            >
              After
            </button>
          </span>
        </div>
      </header>

      {/* ── Photo + Overlay ── */}
      <section className="scan-photo">
        <div className="scan-photo__frame">
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`scan-photo__image${currentImage.src.endsWith(".svg") ? " scan-photo__image--svg" : ""}`}
            priority
            unoptimized={currentImage.src.endsWith(".svg")}
          />
          <ScanLine active={scanning} />
          <MeasurementOverlay points={currentOverlays} scanned={scanned} onPointsChange={setCurrentOverlays} />
          <div className={`scan-photo__badge ${scanned ? "scan-photo__badge--visible" : ""}`}>
            <span className="scan-photo__badge-dot" />
            Scan complete
          </div>
        </div>
      </section>

      {/* ── Metric Sections ── */}
      {METRIC_KEYS.map((key, i) => (
        <MetricSection
          key={key}
          metric={currentMetrics[key]}
          metricKey={key}
          index={i}
          scanned={scanned}
          beforeSrc={beforeImage.src}
          afterSrc={afterImage.src}
          points={beforePts}
          pointsAfter={afterPts}
        />
      ))}

      {/* ── Footer ── */}
      <footer className="scan-footer">
        <p>Scan generated by Protocol AI. Metrics are estimates based on visual analysis.</p>
      </footer>

    </div>
  );
}

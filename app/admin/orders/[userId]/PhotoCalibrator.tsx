"use client";

import { useState, useRef, useCallback } from "react";
import { estimateMaleBodyFat } from "../../../../lib/maleBodyFat";

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type OverlayPoints = {
  shoulderLeft:  { x: number; y: number };
  shoulderRight: { x: number; y: number };
  chestLeft:     { x: number; y: number };
  chestRight:    { x: number; y: number };
  waistLeft:     { x: number; y: number };
  waistRight:    { x: number; y: number };
  postureTop:    { x: number; y: number };
  postureBottom: { x: number; y: number };
};

export type CalibrationMetrics = {
  swr: number;
  cwr: number;
  bf:  number;
  pas: number;
  ti:  number;
  pc:  number;
};

export type BiometricData = {
  height_cm: number;
  weight_kg: number;
  age:       number;
  waist_cm?: number;
};

type Props = {
  userId:          string;
  photoUrl:        string | null;
  initialPoints:   OverlayPoints | null;
  initialMetrics:  CalibrationMetrics | null;
  onSaved:         (metrics: CalibrationMetrics, points: OverlayPoints) => void;
};

/* ─── Defaults ─────────────────────────────────────────────────────────────── */

const DEFAULT_POINTS: OverlayPoints = {
  shoulderLeft:  { x: 24, y: 28 },
  shoulderRight: { x: 76, y: 28 },
  chestLeft:     { x: 27, y: 38 },
  chestRight:    { x: 73, y: 38 },
  waistLeft:     { x: 32, y: 52 },
  waistRight:    { x: 68, y: 52 },
  postureTop:    { x: 50, y:  8 },
  postureBottom: { x: 51, y: 60 },
};

/* ─── Metric computation ───────────────────────────────────────────────────── */

export function computeMetrics(
  pts: OverlayPoints,
  bio?: BiometricData | null
): CalibrationMetrics {
  const sw = Math.abs(pts.shoulderRight.x - pts.shoulderLeft.x);
  const cw = Math.abs(pts.chestRight.x    - pts.chestLeft.x);
  const ww = Math.abs(pts.waistRight.x    - pts.waistLeft.x);
  const vd = Math.abs(
    ((pts.waistLeft.y    + pts.waistRight.y)    / 2) -
    ((pts.shoulderLeft.y + pts.shoulderRight.y) / 2)
  );

  const swr = ww > 0 ? +(sw / ww).toFixed(2) : 0;
  const cwr = ww > 0 ? +(cw / ww).toFixed(2) : 0;
  const ti  = vd > 0 ? +((sw - ww) / vd * 2.5).toFixed(2) : 0;

  const postureDeviation = Math.abs(pts.postureTop.x - pts.postureBottom.x);
  const postureHeight    = Math.abs(pts.postureBottom.y - pts.postureTop.y);
  const pas = postureHeight > 0
    ? Math.round(Math.max(0, Math.min(100, 100 - (postureDeviation / postureHeight) * 300)))
    : 50;

  let bf: number;
  if (bio && bio.height_cm > 0 && bio.weight_kg > 0 && bio.age > 0) {
    try {
      const result = estimateMaleBodyFat({
        age:      bio.age,
        heightCm: bio.height_cm,
        weightKg: bio.weight_kg,
        waistCm:  bio.waist_cm,
      });
      bf = result.pointEstimate;
    } catch {
      const waistRatio = sw > 0 ? ww / sw : 0.8;
      bf = Math.round(Math.max(6, Math.min(40, waistRatio * 35)));
    }
  } else {
    const waistRatio = sw > 0 ? ww / sw : 0.8;
    bf = Math.round(Math.max(6, Math.min(40, waistRatio * 35)));
  }

  const swrScore = Math.max(0, 100 - Math.abs(swr - 1.52) * 150);
  const tiScore  = Math.max(0, 100 - Math.abs(ti  - 1.3)   * 80);
  const pc = Math.round(swrScore * 0.45 + pas * 0.25 + tiScore * 0.3);

  return { swr, cwr, bf, pas, ti, pc };
}

/* ─── Status helper ────────────────────────────────────────────────────────── */

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63],
  cwr: [1.25, 1.35],
  bf:  [10,   17  ],
  pas: [80,   95  ],
  ti:  [1.1,  1.5 ],
  pc:  [75,   95  ],
};

function metricStatus(key: keyof CalibrationMetrics, value: number): "good" | "warn" | "bad" {
  const [min, max] = RANGES[key];
  if (key === "bf") {
    if (value >= min && value <= max) return "good";
    if (value > max && value <= 22)   return "warn";
    return "bad";
  }
  if (value >= min && value <= max) return "good";
  const gap   = Math.min(Math.abs(value - min), Math.abs(value - max));
  const range = max - min;
  return gap < range * 0.8 ? "warn" : "bad";
}

/* ─── Overlay colour palette ───────────────────────────────────────────────── */
// Desaturated, clinical tones — derived from the Protocol Club slate/green palette.
// These are shared with BodyAnalysis.tsx; keep them in sync.

export { OC } from "../../../../lib/overlayColors";
import { OC } from "../../../../lib/overlayColors";

/* ─── SVG Overlay ──────────────────────────────────────────────────────────── */

type DragTarget =
  | "shoulder-left" | "shoulder-right" | "shoulder-band"
  | "chest-left"    | "chest-right"    | "chest-band"
  | "waist-left"    | "waist-right"    | "waist-band"
  | "posture-top"   | "posture-bottom" | "posture-band";

type ActiveBand = "shoulder" | "chest" | "waist" | "posture" | null;

const HITR = 5; // hit-area radius

// Tick handle: a vertical bar with two horizontal notches (grip marks)
function TickHandle({
  x, y, color, onPtrDown,
}: {
  x: number; y: number; color: string;
  onPtrDown: (e: React.PointerEvent) => void;
}) {
  return (
    <g>
      {/* Visible tick */}
      <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke={color} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} />
      <line x1={x - 1.5} y1={y - 2} x2={x + 1.5} y2={y - 2} stroke={color} strokeWidth="0.6" strokeLinecap="round" style={{ pointerEvents: "none" }} />
      <line x1={x - 1.5} y1={y + 2} x2={x + 1.5} y2={y + 2} stroke={color} strokeWidth="0.6" strokeLinecap="round" style={{ pointerEvents: "none" }} />
      {/* Hit area */}
      <rect
        x={x - HITR / 2} y={y - HITR}
        width={HITR} height={HITR * 2}
        fill="transparent"
        style={{ cursor: "ew-resize", pointerEvents: "fill" }}
        onPointerDown={onPtrDown}
      />
    </g>
  );
}

function OverlaySvg({
  points,
  onPointsChange,
}: {
  points: OverlayPoints;
  onPointsChange: (p: OverlayPoints) => void;
}) {
  const svgRef    = useRef<SVGSVGElement>(null);
  const dragging  = useRef<DragTarget | null>(null);
  const dragStart = useRef<{ x: number; y: number; pts: OverlayPoints } | null>(null);
  const [activeBand, setActiveBand] = useState<ActiveBand>(null);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width)  * 100,
      y: ((clientY - r.top)  / r.height) * 100,
    };
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const onPtrDown = (target: DragTarget) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragging.current = target;
    const band: ActiveBand = target.startsWith("shoulder") ? "shoulder"
      : target.startsWith("chest") ? "chest"
      : target.startsWith("waist") ? "waist"
      : "posture";
    setActiveBand(band);
    const c = toSvg(e.clientX, e.clientY);
    if (c) dragStart.current = { x: c.x, y: c.y, pts: JSON.parse(JSON.stringify(points)) };
  };

  const onPtrMove = (e: React.PointerEvent) => {
    const tgt = dragging.current;
    const st  = dragStart.current;
    if (!tgt || !st) return;
    const c = toSvg(e.clientX, e.clientY);
    if (!c) return;
    const dx = c.x - st.x;
    const dy = c.y - st.y;
    const p  = st.pts;
    const mv = (pt: { x: number; y: number }) => ({ x: clamp(pt.x + dx), y: clamp(pt.y + dy) });

    switch (tgt) {
      case "shoulder-left":  onPointsChange({ ...points, shoulderLeft:  mv(p.shoulderLeft)  }); break;
      case "shoulder-right": onPointsChange({ ...points, shoulderRight: mv(p.shoulderRight) }); break;
      case "shoulder-band":  onPointsChange({ ...points, shoulderLeft:  mv(p.shoulderLeft),  shoulderRight: mv(p.shoulderRight) }); break;
      case "chest-left":     onPointsChange({ ...points, chestLeft:     mv(p.chestLeft)     }); break;
      case "chest-right":    onPointsChange({ ...points, chestRight:    mv(p.chestRight)    }); break;
      case "chest-band":     onPointsChange({ ...points, chestLeft:     mv(p.chestLeft),     chestRight:    mv(p.chestRight)    }); break;
      case "waist-left":     onPointsChange({ ...points, waistLeft:     mv(p.waistLeft)     }); break;
      case "waist-right":    onPointsChange({ ...points, waistRight:    mv(p.waistRight)    }); break;
      case "waist-band":     onPointsChange({ ...points, waistLeft:     mv(p.waistLeft),     waistRight:    mv(p.waistRight)    }); break;
      case "posture-top":    onPointsChange({ ...points, postureTop:    mv(p.postureTop)    }); break;
      case "posture-bottom": onPointsChange({ ...points, postureBottom: mv(p.postureBottom) }); break;
      case "posture-band":   onPointsChange({ ...points, postureTop:    mv(p.postureTop),   postureBottom: mv(p.postureBottom) }); break;
    }
  };

  const onPtrUp = () => {
    dragging.current  = null;
    dragStart.current = null;
    setActiveBand(null);
  };

  const shoulderY = (points.shoulderLeft.y  + points.shoulderRight.y) / 2;
  const chestY    = (points.chestLeft.y     + points.chestRight.y)    / 2;
  const waistY    = (points.waistLeft.y     + points.waistRight.y)    / 2;

  const m = computeMetrics(points);

  // Per-band brightness based on active state
  const sBright = activeBand === "shoulder" ? 1 : 0.85;
  const cBright = activeBand === "chest"    ? 1 : 0.85;
  const wBright = activeBand === "waist"    ? 1 : 0.85;
  const pBright = activeBand === "posture"  ? 1 : 0.85;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: "none" }}
      onPointerMove={onPtrMove}
      onPointerUp={onPtrUp}
      onPointerLeave={onPtrUp}
    >
      {/* ── Full-width alignment guides ── */}
      <line x1="0" y1={shoulderY} x2="100" y2={shoulderY} stroke={activeBand === "shoulder" ? OC.shoulder.faint : OC.shoulder.guide} strokeWidth="0.3" />
      <line x1="0" y1={chestY}    x2="100" y2={chestY}    stroke={activeBand === "chest"    ? OC.chest.faint    : OC.chest.guide}    strokeWidth="0.3" />
      <line x1="0" y1={waistY}    x2="100" y2={waistY}    stroke={activeBand === "waist"    ? OC.waist.faint    : OC.waist.guide}    strokeWidth="0.3" />

      {/* ── Taper lines (shoulder → waist silhouette) ── */}
      <line x1={points.shoulderLeft.x}  y1={shoulderY} x2={points.waistLeft.x}  y2={waistY} stroke={OC.shoulder.faint} strokeWidth="0.3" strokeDasharray="1.5 1" />
      <line x1={points.shoulderRight.x} y1={shoulderY} x2={points.waistRight.x} y2={waistY} stroke={OC.shoulder.faint} strokeWidth="0.3" strokeDasharray="1.5 1" />

      {/* ══ SHOULDER ══ */}
      <rect x={points.shoulderLeft.x} y={shoulderY - 6} width={points.shoulderRight.x - points.shoulderLeft.x} height={12} fill="transparent" style={{ cursor: "move", pointerEvents: "fill" }} onPointerDown={onPtrDown("shoulder-band")} />
      <line x1={points.shoulderLeft.x} y1={shoulderY} x2={points.shoulderRight.x} y2={shoulderY} stroke={OC.shoulder.line} strokeWidth={sBright === 1 ? 0.7 : 0.5} opacity={sBright} />
      <line x1={points.shoulderLeft.x}  y1={shoulderY - 3.5} x2={points.shoulderLeft.x}  y2={shoulderY + 3.5} stroke={OC.shoulder.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={sBright} />
      <line x1={points.shoulderRight.x} y1={shoulderY - 3.5} x2={points.shoulderRight.x} y2={shoulderY + 3.5} stroke={OC.shoulder.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={sBright} />
      <text x={points.shoulderRight.x + 2} y={shoulderY - 1.5} textAnchor="start" fontSize="2.2" fill={OC.shoulder.line} fontWeight="600" letterSpacing="0.15" opacity={sBright}>SWR {m.swr}</text>
      <TickHandle x={points.shoulderLeft.x}  y={shoulderY} color={OC.shoulder.line} onPtrDown={onPtrDown("shoulder-left")}  />
      <TickHandle x={points.shoulderRight.x} y={shoulderY} color={OC.shoulder.line} onPtrDown={onPtrDown("shoulder-right")} />

      {/* ══ CHEST ══ */}
      <rect x={points.chestLeft.x} y={chestY - 6} width={points.chestRight.x - points.chestLeft.x} height={12} fill="transparent" style={{ cursor: "move", pointerEvents: "fill" }} onPointerDown={onPtrDown("chest-band")} />
      <line x1={points.chestLeft.x} y1={chestY} x2={points.chestRight.x} y2={chestY} stroke={OC.chest.line} strokeWidth={cBright === 1 ? 0.7 : 0.5} opacity={cBright} />
      <line x1={points.chestLeft.x}  y1={chestY - 3.5} x2={points.chestLeft.x}  y2={chestY + 3.5} stroke={OC.chest.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={cBright} />
      <line x1={points.chestRight.x} y1={chestY - 3.5} x2={points.chestRight.x} y2={chestY + 3.5} stroke={OC.chest.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={cBright} />
      <text x={points.chestRight.x + 2} y={chestY - 1.5} textAnchor="start" fontSize="2.2" fill={OC.chest.line} fontWeight="600" letterSpacing="0.15" opacity={cBright}>CWR {m.cwr}</text>
      <TickHandle x={points.chestLeft.x}  y={chestY} color={OC.chest.line} onPtrDown={onPtrDown("chest-left")}  />
      <TickHandle x={points.chestRight.x} y={chestY} color={OC.chest.line} onPtrDown={onPtrDown("chest-right")} />

      {/* ══ WAIST ══ */}
      <rect x={points.waistLeft.x} y={waistY - 6} width={points.waistRight.x - points.waistLeft.x} height={12} fill="transparent" style={{ cursor: "move", pointerEvents: "fill" }} onPointerDown={onPtrDown("waist-band")} />
      <line x1={points.waistLeft.x} y1={waistY} x2={points.waistRight.x} y2={waistY} stroke={OC.waist.line} strokeWidth={wBright === 1 ? 0.7 : 0.5} opacity={wBright} />
      <line x1={points.waistLeft.x}  y1={waistY - 3.5} x2={points.waistLeft.x}  y2={waistY + 3.5} stroke={OC.waist.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={wBright} />
      <line x1={points.waistRight.x} y1={waistY - 3.5} x2={points.waistRight.x} y2={waistY + 3.5} stroke={OC.waist.line} strokeWidth="0.8" strokeLinecap="round" style={{ pointerEvents: "none" }} opacity={wBright} />
      <text x={points.waistRight.x + 2} y={waistY - 1.5} textAnchor="start" fontSize="2.2" fill={OC.waist.line} fontWeight="600" letterSpacing="0.15" opacity={wBright}>TI {m.ti}</text>
      <TickHandle x={points.waistLeft.x}  y={waistY} color={OC.waist.line} onPtrDown={onPtrDown("waist-left")}  />
      <TickHandle x={points.waistRight.x} y={waistY} color={OC.waist.line} onPtrDown={onPtrDown("waist-right")} />

      {/* ══ POSTURE ══ */}
      {(() => {
        const { postureTop: pt, postureBottom: pb } = points;
        const midX = (pt.x + pb.x) / 2;
        const midY = (pt.y + pb.y) / 2;
        const minX = Math.min(pt.x, pb.x);
        const bandW = Math.abs(pb.x - pt.x) + 3;
        return (
          <g opacity={pBright}>
            <rect x={minX - 1.5} y={pt.y} width={bandW} height={pb.y - pt.y} fill="transparent" style={{ cursor: "move", pointerEvents: "fill" }} onPointerDown={onPtrDown("posture-band")} />
            {/* Ideal plumb line */}
            <line x1={midX} y1={pt.y} x2={midX} y2={pb.y} stroke={OC.posture.faint} strokeWidth="0.3" strokeDasharray="2 2" />
            {/* Actual axis */}
            <line x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y} stroke={OC.posture.line} strokeWidth="0.5" strokeDasharray="2 1.5" />
            <text x={Math.max(pt.x, pb.x) + 2.5} y={midY + 1} textAnchor="start" fontSize="2.2" fill={OC.posture.line} fontWeight="600" letterSpacing="0.15">PAS {m.pas}</text>
            {/* Endpoint circles */}
            <circle cx={pt.x} cy={pt.y} r={1.4} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.4" style={{ pointerEvents: "none" }} />
            <circle cx={pb.x} cy={pb.y} r={1.4} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.4" style={{ pointerEvents: "none" }} />
            <circle cx={pt.x} cy={pt.y} r={HITR} fill="transparent" style={{ cursor: "move", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-top")} />
            <circle cx={pb.x} cy={pb.y} r={HITR} fill="transparent" style={{ cursor: "move", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-bottom")} />
          </g>
        );
      })()}
    </svg>
  );
}

/* ─── Placement guide ──────────────────────────────────────────────────────── */

const PLACEMENT_GUIDE = [
  {
    color:  OC.shoulder.line,
    bg:     OC.shoulder.faint,
    border: OC.shoulder.faint,
    code:   "SWR",
    label:  "Épaules",
    hint:   "Acromions — pointe osseuse la plus externe de chaque épaule. Ni les bras, ni les deltoïdes.",
  },
  {
    color:  OC.chest.line,
    bg:     OC.chest.faint,
    border: OC.chest.faint,
    code:   "CWR",
    label:  "Poitrine",
    hint:   "Ligne des mamelons — point le plus large de la cage thoracique. Plus large que la taille.",
  },
  {
    color:  OC.waist.line,
    bg:     OC.waist.faint,
    border: OC.waist.faint,
    code:   "TI",
    label:  "Taille",
    hint:   "Creux naturel entre les dernières côtes et les hanches. Si pas visible : au niveau du nombril.",
  },
  {
    color:  OC.posture.line,
    bg:     OC.posture.faint,
    border: OC.posture.faint,
    code:   "PAS",
    label:  "Posture",
    hint:   "Oreille (haut) → cheville (bas). Sur photo de profil uniquement.",
  },
];

/* ─── Mini scale bar ───────────────────────────────────────────────────────── */

const SCALE_RANGES: Record<keyof CalibrationMetrics, { min: number; max: number }> = {
  swr: { min: 1.00, max: 1.90 },
  cwr: { min: 0.80, max: 1.60 },
  bf:  { min: 6,    max: 34   },
  pas: { min: 40,   max: 100  },
  ti:  { min: 0.20, max: 2.00 },
  pc:  { min: 0,    max: 100  },
};

function MiniScaleBar({
  metricKey, value, status,
}: {
  metricKey: keyof CalibrationMetrics;
  value: number;
  status: "good" | "warn" | "bad";
}) {
  const { min, max } = SCALE_RANGES[metricKey];
  const [optMin, optMax] = RANGES[metricKey];
  const toPos = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

  const markerColor = status === "good" ? "#0c6826" : status === "warn" ? "#eb850a" : "#bb3030";
  const zoneLeft  = toPos(optMin);
  const zoneRight = toPos(optMax);
  const markerPos = toPos(value);

  return (
    <div className="mt-1.5 relative h-[3px] rounded-full bg-[#edf0f1] overflow-visible">
      {/* Optimal zone */}
      <div
        className="absolute top-0 bottom-0 rounded-full"
        style={{
          left:       `${zoneLeft}%`,
          right:      `${100 - zoneRight}%`,
          background: status === "good"
            ? "linear-gradient(90deg,#b5d9c6,#8ec0a4,#b5d9c6)"
            : "rgba(180,180,180,0.3)",
        }}
      />
      {/* Value marker */}
      <div
        className="absolute top-1/2 w-[7px] h-[7px] rounded-full border-[1.5px] border-white -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${markerPos}%`, background: markerColor, boxShadow: `0 0 0 1px ${markerColor}` }}
      />
    </div>
  );
}

/* ─── Metric defs ──────────────────────────────────────────────────────────── */

const METRIC_DEFS: {
  key:   keyof CalibrationMetrics;
  label: string;
  rec:   string;
  fmt:   (v: number) => string;
}[] = [
  { key: "swr", label: "SWR", rec: "1.41 – 1.63", fmt: (v) => v.toFixed(2) },
  { key: "cwr", label: "CWR", rec: "1.25 – 1.35", fmt: (v) => v.toFixed(2) },
  { key: "bf",  label: "BF%", rec: "10 – 17 %",   fmt: (v) => `${v}%`      },
  { key: "pas", label: "PAS", rec: "80 – 95",      fmt: (v) => String(v)    },
  { key: "ti",  label: "TI",  rec: "1.1 – 1.5",   fmt: (v) => v.toFixed(2) },
  { key: "pc",  label: "PC",  rec: "75 – 95",      fmt: (v) => String(v)    },
];

/* ─── Main component ───────────────────────────────────────────────────────── */

export default function PhotoCalibrator({ userId, photoUrl, initialPoints, onSaved }: Props) {
  const [points,       setPoints]       = useState<OverlayPoints>(initialPoints ?? DEFAULT_POINTS);
  const [saving,       setSaving]       = useState(false);
  const [savedAt,      setSavedAt]      = useState<Date | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [guideOpen,    setGuideOpen]    = useState(false);

  const metrics = computeMetrics(points);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/calibration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay_points: points, metrics }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error ?? "Save failed.");
      } else {
        setSavedAt(new Date());
        onSaved(metrics, points);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setPoints(DEFAULT_POINTS);

  return (
    <div className="space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#253239]">
          Calibration
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGuideOpen(v => !v)}
            className="text-[11px] font-medium text-[#7f949b] transition-colors hover:text-[#253239]"
          >
            {guideOpen ? "Fermer guide" : "Guide placement"}
          </button>
          <span className="text-[#dfe4e6]">·</span>
          <button
            onClick={handleReset}
            className="text-[11px] text-[#7f949b] transition-colors hover:text-[#253239]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Placement guide ── */}
      {guideOpen && (
        <div className="rounded-xl border border-[#edf0f1] bg-[#f9fbfb] overflow-hidden">
          {PLACEMENT_GUIDE.map(({ color, bg, border, code, label, hint }) => (
            <div
              key={code}
              className="flex items-start gap-3 px-3.5 py-2.5 border-b border-[#edf0f1] last:border-b-0"
            >
              <div
                className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em]"
                style={{ background: bg, border: `1px solid ${border}`, color }}
              >
                {code}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#253239] leading-none mb-1">{label}</p>
                <p className="text-[11px] leading-relaxed text-[#7f949b]">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Photo + overlay ── */}
      {photoUrl ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-[#0d0d0d]" style={{ aspectRatio: "3/4" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Front photo"
            className="absolute inset-0 h-full w-full object-cover object-top"
            draggable={false}
          />
          <OverlaySvg points={points} onPointsChange={setPoints} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#edf0f1] bg-[#f9fbfb]" style={{ aspectRatio: "3/4" }}>
          <div className="text-[24px] opacity-20">◎</div>
          <p className="text-[11px] text-[#7f949b]">No front photo uploaded</p>
        </div>
      )}

      <p className="text-center text-[10px] tracking-[0.06em] text-[#9eb1b8]">
        Glisser la ligne · tirer les extrémités pour redimensionner
      </p>

      {/* ── Metrics grid ── */}
      <div className="grid grid-cols-3 gap-2">
        {METRIC_DEFS.map(({ key, label, rec, fmt }) => {
          const value  = metrics[key];
          const status = metricStatus(key, value);
          const valueColor = status === "good"
            ? "#0c6826"
            : status === "warn"
            ? "#eb850a"
            : "#bb3030";
          return (
            <div
              key={key}
              className="rounded-lg border border-[#edf0f1] bg-white px-2.5 py-2.5"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7f949b]">
                {label}
              </p>
              <p
                className="mt-1 text-[15px] font-semibold tabular-nums leading-none"
                style={{ color: valueColor, fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(value)}
              </p>
              <MiniScaleBar metricKey={key} value={value} status={status} />
              <p className="mt-1.5 text-[9px] text-[#9eb1b8]">{rec}</p>
            </div>
          );
        })}
      </div>

      {/* ── Errors / confirmation ── */}
      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[11.5px] text-red-600">
          {error}
        </p>
      )}
      {savedAt && !error && (
        <p className="text-center text-[11px] text-emerald-600">
          Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {/* ── Save button ── */}
      <button
        onClick={handleSave}
        disabled={saving || !photoUrl}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#253239] px-4 py-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-white border-t-transparent" />
            Saving…
          </>
        ) : (
          "Save calibration →"
        )}
      </button>
    </div>
  );
}

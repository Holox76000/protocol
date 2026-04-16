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
  waist_cm?: number; // from questionnaire waist_circumference_cm, if available
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

  // BF% — multi-formula decision tree (CUN-BAE + RFM + Deurenberg) when bio
  // data is available. Falls back to a rough pixel-ratio estimate otherwise.
  let bf: number;
  if (bio && bio.height_cm > 0 && bio.weight_kg > 0 && bio.age > 0) {
    try {
      const result = estimateMaleBodyFat({
        age:       bio.age,
        heightCm:  bio.height_cm,
        weightKg:  bio.weight_kg,
        waistCm:   bio.waist_cm, // uses questionnaire waist when available
      });
      bf = result.pointEstimate;
    } catch {
      // Validation rejected the bio values — use pixel fallback
      const waistRatio = sw > 0 ? ww / sw : 0.8;
      bf = Math.round(Math.max(6, Math.min(40, waistRatio * 35)));
    }
  } else {
    // No bio data — pixel-based fallback, shown as "~"
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

/* ─── SVG Overlay ──────────────────────────────────────────────────────────── */

type DragTarget =
  | "shoulder-left" | "shoulder-right" | "shoulder-band"
  | "chest-left"    | "chest-right"    | "chest-band"
  | "waist-left"    | "waist-right"    | "waist-band"
  | "posture-top"   | "posture-bottom" | "posture-band";

const BH   = 5;   // band height in SVG units
const BW   = 2.5; // posture band width
const HITR = 4;   // hit-area radius

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
      case "shoulder-band":  onPointsChange({ ...points, shoulderLeft:  mv(p.shoulderLeft), shoulderRight: mv(p.shoulderRight) }); break;
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

  const onPtrUp = () => { dragging.current = null; dragStart.current = null; };

  const shoulderY = (points.shoulderLeft.y  + points.shoulderRight.y) / 2;
  const chestY    = (points.chestLeft.y     + points.chestRight.y)    / 2;
  const waistY    = (points.waistLeft.y     + points.waistRight.y)    / 2;

  const m = computeMetrics(points);

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
      {/* Taper lines */}
      <line x1={points.shoulderLeft.x}  y1={points.shoulderLeft.y}  x2={points.waistLeft.x}  y2={points.waistLeft.y}
        stroke="rgba(120,230,160,0.45)" strokeWidth="0.4" strokeDasharray="1.5 1" />
      <line x1={points.shoulderRight.x} y1={points.shoulderRight.y} x2={points.waistRight.x} y2={points.waistRight.y}
        stroke="rgba(120,230,160,0.45)" strokeWidth="0.4" strokeDasharray="1.5 1" />

      {/* ── Shoulder band ── */}
      <rect
        x={points.shoulderLeft.x} y={shoulderY - BH / 2}
        width={points.shoulderRight.x - points.shoulderLeft.x} height={BH}
        fill="rgba(120,230,160,0.15)" stroke="rgba(120,230,160,0.85)" strokeWidth="0.5"
        style={{ cursor: "move", pointerEvents: "fill" }}
        onPointerDown={onPtrDown("shoulder-band")}
      />
      <line x1={points.shoulderLeft.x} y1={shoulderY} x2={points.shoulderRight.x} y2={shoulderY}
        stroke="rgba(120,230,160,1)" strokeWidth="0.7" />
      <text x={(points.shoulderLeft.x + points.shoulderRight.x) / 2} y={shoulderY - BH / 2 - 2.2}
        textAnchor="middle" fontSize="3" fill="rgba(120,230,160,1)" fontWeight="700" letterSpacing="0.3">
        SHOULDERS · SWR {m.swr}
      </text>
      {/* Handles */}
      <rect x={points.shoulderLeft.x - 1}        y={shoulderY - BH / 2} width={2}    height={BH} fill="rgba(120,230,160,0.9)" />
      <rect x={points.shoulderLeft.x - HITR / 2} y={shoulderY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("shoulder-left")} />
      <rect x={points.shoulderRight.x - 1}        y={shoulderY - BH / 2} width={2}    height={BH} fill="rgba(120,230,160,0.9)" />
      <rect x={points.shoulderRight.x - HITR / 2} y={shoulderY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("shoulder-right")} />

      {/* ── Chest band ── */}
      <rect
        x={points.chestLeft.x} y={chestY - BH / 2}
        width={points.chestRight.x - points.chestLeft.x} height={BH}
        fill="rgba(200,160,250,0.15)" stroke="rgba(200,160,250,0.85)" strokeWidth="0.5"
        style={{ cursor: "move", pointerEvents: "fill" }}
        onPointerDown={onPtrDown("chest-band")}
      />
      <line x1={points.chestLeft.x} y1={chestY} x2={points.chestRight.x} y2={chestY}
        stroke="rgba(200,160,250,1)" strokeWidth="0.7" />
      <text x={(points.chestLeft.x + points.chestRight.x) / 2} y={chestY - BH / 2 - 2.2}
        textAnchor="middle" fontSize="3" fill="rgba(200,160,250,1)" fontWeight="700" letterSpacing="0.3">
        CHEST · CWR {m.cwr}
      </text>
      <rect x={points.chestLeft.x - 1}        y={chestY - BH / 2} width={2}    height={BH} fill="rgba(200,160,250,0.9)" />
      <rect x={points.chestLeft.x - HITR / 2} y={chestY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("chest-left")} />
      <rect x={points.chestRight.x - 1}        y={chestY - BH / 2} width={2}    height={BH} fill="rgba(200,160,250,0.9)" />
      <rect x={points.chestRight.x - HITR / 2} y={chestY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("chest-right")} />

      {/* ── Waist band ── */}
      <rect
        x={points.waistLeft.x} y={waistY - BH / 2}
        width={points.waistRight.x - points.waistLeft.x} height={BH}
        fill="rgba(240,190,90,0.15)" stroke="rgba(240,190,90,0.85)" strokeWidth="0.5"
        style={{ cursor: "move", pointerEvents: "fill" }}
        onPointerDown={onPtrDown("waist-band")}
      />
      <line x1={points.waistLeft.x} y1={waistY} x2={points.waistRight.x} y2={waistY}
        stroke="rgba(240,190,90,1)" strokeWidth="0.7" />
      <text x={(points.waistLeft.x + points.waistRight.x) / 2} y={waistY + BH / 2 + 3.5}
        textAnchor="middle" fontSize="3" fill="rgba(240,190,90,1)" fontWeight="700" letterSpacing="0.3">
        WAIST · TI {m.ti}
      </text>
      <rect x={points.waistLeft.x - 1}        y={waistY - BH / 2} width={2}    height={BH} fill="rgba(240,190,90,0.9)" />
      <rect x={points.waistLeft.x - HITR / 2} y={waistY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("waist-left")} />
      <rect x={points.waistRight.x - 1}        y={waistY - BH / 2} width={2}    height={BH} fill="rgba(240,190,90,0.9)" />
      <rect x={points.waistRight.x - HITR / 2} y={waistY - BH}     width={HITR} height={BH * 2} fill="transparent" style={{ cursor: "ew-resize", pointerEvents: "fill" }} onPointerDown={onPtrDown("waist-right")} />

      {/* ── Posture line ── */}
      {(() => {
        const minX  = Math.min(points.postureTop.x, points.postureBottom.x);
        const bandW = Math.abs(points.postureBottom.x - points.postureTop.x) + BW;
        return (
          <g>
            <rect
              x={minX - BW / 2} y={points.postureTop.y}
              width={bandW} height={points.postureBottom.y - points.postureTop.y}
              fill="rgba(160,180,240,0.08)" stroke="rgba(160,180,240,0.5)" strokeWidth="0.35"
              style={{ cursor: "move", pointerEvents: "fill" }}
              onPointerDown={onPtrDown("posture-band")}
            />
            <line
              x1={points.postureTop.x} y1={points.postureTop.y}
              x2={points.postureBottom.x} y2={points.postureBottom.y}
              stroke="rgba(160,180,240,1)" strokeWidth="0.65" strokeDasharray="2 1.5"
            />
            <text
              x={Math.max(points.postureTop.x, points.postureBottom.x) + BW / 2 + 2}
              y={points.postureTop.y + 3.5}
              textAnchor="start" fontSize="3" fill="rgba(160,180,240,1)" fontWeight="700" letterSpacing="0.3"
            >
              POSTURE · PAS {m.pas}
            </text>
            <circle cx={points.postureTop.x} cy={points.postureTop.y} r={1} fill="white" stroke="rgba(160,180,240,1)" strokeWidth="0.4" style={{ pointerEvents: "none" }} />
            <circle cx={points.postureTop.x} cy={points.postureTop.y} r={HITR} fill="transparent" style={{ cursor: "ns-resize", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-top")} />
            <circle cx={points.postureBottom.x} cy={points.postureBottom.y} r={1} fill="white" stroke="rgba(160,180,240,1)" strokeWidth="0.4" style={{ pointerEvents: "none" }} />
            <circle cx={points.postureBottom.x} cy={points.postureBottom.y} r={HITR} fill="transparent" style={{ cursor: "ns-resize", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-bottom")} />
          </g>
        );
      })()}
    </svg>
  );
}

/* ─── Metric chips ─────────────────────────────────────────────────────────── */

const METRIC_DEFS: { key: keyof CalibrationMetrics; label: string; rec: string; fmt: (v: number) => string }[] = [
  { key: "swr", label: "SWR", rec: "1.41–1.63", fmt: (v) => String(v) },
  { key: "cwr", label: "CWR", rec: "1.25–1.35", fmt: (v) => String(v) },
  { key: "bf",  label: "BF%", rec: "10–17%",    fmt: (v) => `${v}%`   },
  { key: "pas", label: "PAS", rec: "80–95",      fmt: (v) => `${v}`   },
  { key: "ti",  label: "TI",  rec: "1.1–1.5",   fmt: (v) => String(v) },
  { key: "pc",  label: "PC",  rec: "75–95",      fmt: (v) => `${v}`   },
];

/* ─── Main component ───────────────────────────────────────────────────────── */

export default function PhotoCalibrator({ userId, photoUrl, initialPoints, onSaved }: Props) {
  const [points,  setPoints]  = useState<OverlayPoints>(initialPoints ?? DEFAULT_POINTS);
  const [saving,  setSaving]  = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error,   setError]   = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-mute">
          Calibration
        </p>
        <button
          onClick={handleReset}
          className="text-[11px] text-mute transition-colors hover:text-void"
        >
          Reset
        </button>
      </div>

      {/* Photo + overlay */}
      {photoUrl ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "3/4" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Front photo"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <OverlaySvg points={points} onPointsChange={setPoints} />
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-wire bg-ash" style={{ aspectRatio: "3/4" }}>
          <p className="text-[12px] text-mute">No front photo uploaded</p>
        </div>
      )}

      <p className="text-center text-[10px] text-mute">
        Drag the bands · hold the center to move · edges to resize
      </p>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        {METRIC_DEFS.map(({ key, label, rec, fmt }) => {
          const value  = metrics[key];
          const status = metricStatus(key, value);
          return (
            <div key={key} className="rounded-lg border border-wire bg-ash px-2.5 py-2 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</p>
              <p className={`mt-0.5 text-[15px] font-semibold tabular-nums leading-none ${
                status === "good" ? "text-emerald-600" : status === "warn" ? "text-amber-600" : "text-red-600"
              }`}>
                {fmt(value)}
              </p>
              <p className="mt-0.5 text-[9px] text-mute">{rec}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</p>
      )}

      {savedAt && (
        <p className="text-center text-[11px] text-emerald-600">
          Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !photoUrl}
        className="flex w-full items-center justify-center rounded-lg bg-void px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save calibration →"}
      </button>
    </div>
  );
}

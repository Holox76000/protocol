"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OverlayPoints, CalibrationMetrics, BiometricData } from "../PhotoCalibrator";
import { computeMetrics } from "../PhotoCalibrator";
import { estimateMaleBodyFat } from "../../../../../lib/maleBodyFat";

/* ─── Types ────────────────────────────────────────────────────────────────── */

type Photos = {
  front: string | null;
  side:  string | null;
  back:  string | null;
  face:  string | null;
};

type StepDef = {
  id:          "front" | "side" | "back" | "face";
  label:       string;
  photoUrl:    string;
  overlayType: "body" | "posture" | "none";
  hint:        string;
};

type Props = {
  userId:         string;
  userName:       string;
  photos:         Photos;
  initialPoints:  OverlayPoints | null;
  initialMetrics: CalibrationMetrics | null;
  bio:            BiometricData | null;
};

/* ─── Constants ────────────────────────────────────────────────────────────── */

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

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63], cwr: [1.25, 1.35], bf: [10, 17],
  pas: [80, 95],     ti:  [1.1, 1.5],   pc: [75, 95],
};

const METRIC_DEFS: {
  key:   keyof CalibrationMetrics;
  label: string;
  abbr:  string;
  rec:   string;
  fmt:   (v: number) => string;
}[] = [
  { key: "swr", label: "Shoulder-Waist Ratio", abbr: "SWR", rec: "1.41–1.63", fmt: (v) => String(v) },
  { key: "cwr", label: "Chest-Waist Ratio",    abbr: "CWR", rec: "1.25–1.35", fmt: (v) => String(v) },
  { key: "bf",  label: "Body Fat",             abbr: "BF%", rec: "10–17%",    fmt: (v) => `${v}%`   },
  { key: "pas", label: "Posture Score",         abbr: "PAS", rec: "80–95",     fmt: (v) => `${v}`    },
  { key: "ti",  label: "Taper Index",           abbr: "TI",  rec: "1.1–1.5",  fmt: (v) => String(v) },
  { key: "pc",  label: "Proportion",            abbr: "PC",  rec: "75–95",     fmt: (v) => `${v}`    },
];

function metricStatus(key: keyof CalibrationMetrics, value: number): "good" | "warn" | "bad" {
  const [min, max] = RANGES[key];
  if (key === "bf") {
    if (value >= min && value <= max) return "good";
    if (value > max && value <= 22)   return "warn";
    return "bad";
  }
  if (value >= min && value <= max) return "good";
  const gap = Math.min(Math.abs(value - min), Math.abs(value - max));
  return gap < (max - min) * 0.8 ? "warn" : "bad";
}

/* ─── Overlay SVG (front photo only) ──────────────────────────────────────── */

type DragTarget =
  | "shoulder-left" | "shoulder-right" | "shoulder-band"
  | "chest-left"    | "chest-right"    | "chest-band"
  | "waist-left"    | "waist-right"    | "waist-band";

const HITR = 3.5; // hit area radius

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
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
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
      case "shoulder-band":  onPointsChange({ ...points, shoulderLeft: mv(p.shoulderLeft), shoulderRight: mv(p.shoulderRight) }); break;
      case "chest-left":     onPointsChange({ ...points, chestLeft:     mv(p.chestLeft)     }); break;
      case "chest-right":    onPointsChange({ ...points, chestRight:    mv(p.chestRight)    }); break;
      case "chest-band":     onPointsChange({ ...points, chestLeft: mv(p.chestLeft), chestRight: mv(p.chestRight) }); break;
      case "waist-left":     onPointsChange({ ...points, waistLeft:     mv(p.waistLeft)     }); break;
      case "waist-right":    onPointsChange({ ...points, waistRight:    mv(p.waistRight)    }); break;
      case "waist-band":     onPointsChange({ ...points, waistLeft: mv(p.waistLeft), waistRight: mv(p.waistRight) }); break;
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
      <line x1={points.shoulderLeft.x}  y1={points.shoulderLeft.y}  x2={points.waistLeft.x}  y2={points.waistLeft.y}  stroke="rgba(120,230,160,0.3)" strokeWidth="0.2" strokeDasharray="1.2 0.8" />
      <line x1={points.shoulderRight.x} y1={points.shoulderRight.y} x2={points.waistRight.x} y2={points.waistRight.y} stroke="rgba(120,230,160,0.3)" strokeWidth="0.2" strokeDasharray="1.2 0.8" />

      {/* ── Shoulder — hairline + wide invisible drag band ── */}
      {/* Invisible drag zone for the whole band */}
      <rect x={points.shoulderLeft.x} y={shoulderY - 4} width={points.shoulderRight.x - points.shoulderLeft.x} height={8}
        fill="transparent" style={{ cursor:"move", pointerEvents:"fill" }} onPointerDown={onPtrDown("shoulder-band")} />
      {/* Hairline */}
      <line x1={points.shoulderLeft.x} y1={shoulderY} x2={points.shoulderRight.x} y2={shoulderY} stroke="rgba(120,230,160,1)" strokeWidth="0.25" />
      {/* End dots */}
      <circle cx={points.shoulderLeft.x}  cy={shoulderY} r={0.6} fill="rgba(120,230,160,1)" />
      <circle cx={points.shoulderRight.x} cy={shoulderY} r={0.6} fill="rgba(120,230,160,1)" />
      {/* Label */}
      <text x={(points.shoulderLeft.x + points.shoulderRight.x)/2} y={shoulderY - 2.5} textAnchor="middle" fontSize="2.2" fill="rgba(120,230,160,0.9)" fontWeight="700" letterSpacing="0.3">SHOULDERS · SWR {m.swr}</text>
      {/* Edge handles — invisible wide hit, thin visual tick */}
      <line x1={points.shoulderLeft.x} y1={shoulderY - 2} x2={points.shoulderLeft.x} y2={shoulderY + 2} stroke="rgba(120,230,160,1)" strokeWidth="0.4" />
      <rect x={points.shoulderLeft.x - HITR/2} y={shoulderY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("shoulder-left")} />
      <line x1={points.shoulderRight.x} y1={shoulderY - 2} x2={points.shoulderRight.x} y2={shoulderY + 2} stroke="rgba(120,230,160,1)" strokeWidth="0.4" />
      <rect x={points.shoulderRight.x - HITR/2} y={shoulderY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("shoulder-right")} />

      {/* ── Chest ── */}
      <rect x={points.chestLeft.x} y={chestY - 4} width={points.chestRight.x - points.chestLeft.x} height={8}
        fill="transparent" style={{ cursor:"move", pointerEvents:"fill" }} onPointerDown={onPtrDown("chest-band")} />
      <line x1={points.chestLeft.x} y1={chestY} x2={points.chestRight.x} y2={chestY} stroke="rgba(200,160,250,1)" strokeWidth="0.25" />
      <circle cx={points.chestLeft.x}  cy={chestY} r={0.6} fill="rgba(200,160,250,1)" />
      <circle cx={points.chestRight.x} cy={chestY} r={0.6} fill="rgba(200,160,250,1)" />
      <text x={(points.chestLeft.x + points.chestRight.x)/2} y={chestY - 2.5} textAnchor="middle" fontSize="2.2" fill="rgba(200,160,250,0.9)" fontWeight="700" letterSpacing="0.3">CHEST · CWR {m.cwr}</text>
      <line x1={points.chestLeft.x} y1={chestY - 2} x2={points.chestLeft.x} y2={chestY + 2} stroke="rgba(200,160,250,1)" strokeWidth="0.4" />
      <rect x={points.chestLeft.x - HITR/2} y={chestY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("chest-left")} />
      <line x1={points.chestRight.x} y1={chestY - 2} x2={points.chestRight.x} y2={chestY + 2} stroke="rgba(200,160,250,1)" strokeWidth="0.4" />
      <rect x={points.chestRight.x - HITR/2} y={chestY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("chest-right")} />

      {/* ── Waist ── */}
      <rect x={points.waistLeft.x} y={waistY - 4} width={points.waistRight.x - points.waistLeft.x} height={8}
        fill="transparent" style={{ cursor:"move", pointerEvents:"fill" }} onPointerDown={onPtrDown("waist-band")} />
      <line x1={points.waistLeft.x} y1={waistY} x2={points.waistRight.x} y2={waistY} stroke="rgba(240,190,90,1)" strokeWidth="0.25" />
      <circle cx={points.waistLeft.x}  cy={waistY} r={0.6} fill="rgba(240,190,90,1)" />
      <circle cx={points.waistRight.x} cy={waistY} r={0.6} fill="rgba(240,190,90,1)" />
      <text x={(points.waistLeft.x + points.waistRight.x)/2} y={waistY + 4} textAnchor="middle" fontSize="2.2" fill="rgba(240,190,90,0.9)" fontWeight="700" letterSpacing="0.3">WAIST · TI {m.ti}</text>
      <line x1={points.waistLeft.x} y1={waistY - 2} x2={points.waistLeft.x} y2={waistY + 2} stroke="rgba(240,190,90,1)" strokeWidth="0.4" />
      <rect x={points.waistLeft.x - HITR/2} y={waistY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("waist-left")} />
      <line x1={points.waistRight.x} y1={waistY - 2} x2={points.waistRight.x} y2={waistY + 2} stroke="rgba(240,190,90,1)" strokeWidth="0.4" />
      <rect x={points.waistRight.x - HITR/2} y={waistY - HITR} width={HITR} height={HITR*2} fill="transparent" style={{ cursor:"ew-resize", pointerEvents:"fill" }} onPointerDown={onPtrDown("waist-right")} />

    </svg>
  );
}

/* ─── Posture overlay (side photo) ────────────────────────────────────────── */

type PostureDragTarget = "posture-top" | "posture-bottom" | "posture-band";

const POSTURE_HITR = 4;

function PostureOverlaySvg({
  points,
  onPointsChange,
  pas,
}: {
  points: OverlayPoints;
  onPointsChange: (p: OverlayPoints) => void;
  pas: number;
}) {
  const svgRef    = useRef<SVGSVGElement>(null);
  const dragging  = useRef<PostureDragTarget | null>(null);
  const dragStart = useRef<{ x: number; y: number; pts: OverlayPoints } | null>(null);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  const onPtrDown = (target: PostureDragTarget) => (e: React.PointerEvent) => {
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
      case "posture-top":    onPointsChange({ ...points, postureTop:    mv(p.postureTop)    }); break;
      case "posture-bottom": onPointsChange({ ...points, postureBottom: mv(p.postureBottom) }); break;
      case "posture-band":   onPointsChange({ ...points, postureTop: mv(p.postureTop), postureBottom: mv(p.postureBottom) }); break;
    }
  };

  const onPtrUp = () => { dragging.current = null; dragStart.current = null; };

  const { postureTop: pt, postureBottom: pb } = points;
  const midX = (pt.x + pb.x) / 2;

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
      {/* Ideal vertical reference */}
      <line
        x1={midX} y1={pt.y} x2={midX} y2={pb.y}
        stroke="rgba(160,180,240,0.2)" strokeWidth="0.3" strokeDasharray="2 2"
      />

      {/* Actual posture axis */}
      <line
        x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y}
        stroke="rgba(160,180,240,1)" strokeWidth="0.3"
        strokeDasharray="2 1.5"
      />

      {/* Invisible drag band along the line */}
      <rect
        x={Math.min(pt.x, pb.x) - 3} y={pt.y}
        width={Math.abs(pb.x - pt.x) + 6} height={pb.y - pt.y}
        fill="transparent" style={{ cursor: "move", pointerEvents: "fill" }}
        onPointerDown={onPtrDown("posture-band")}
      />

      {/* Top handle — ear */}
      <circle cx={pt.x} cy={pt.y} r={1.2} fill="rgba(160,180,240,1)" />
      <circle cx={pt.x} cy={pt.y} r={POSTURE_HITR} fill="transparent" style={{ cursor: "move", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-top")} />
      <text x={pt.x + 2.5} y={pt.y + 1} fontSize="2.2" fill="rgba(160,180,240,0.8)" fontWeight="600">EAR</text>

      {/* Bottom handle — ankle */}
      <circle cx={pb.x} cy={pb.y} r={1.2} fill="rgba(160,180,240,1)" />
      <circle cx={pb.x} cy={pb.y} r={POSTURE_HITR} fill="transparent" style={{ cursor: "move", pointerEvents: "all" }} onPointerDown={onPtrDown("posture-bottom")} />
      <text x={pb.x + 2.5} y={pb.y - 1} fontSize="2.2" fill="rgba(160,180,240,0.8)" fontWeight="600">ANKLE</text>

      {/* PAS label */}
      <text
        x={Math.max(pt.x, pb.x) + 3.5}
        y={(pt.y + pb.y) / 2}
        textAnchor="start" fontSize="2.4" fill="rgba(160,180,240,1)" fontWeight="700" letterSpacing="0.3"
      >
        PAS {pas}
      </text>
    </svg>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */

export default function CalibrateClient({ userId, userName, photos, initialPoints, initialMetrics, bio }: Props) {
  const router = useRouter();

  // Build step list from available photos only
  const steps: StepDef[] = (
    [
      { id: "front" as const, label: "Front", photoUrl: photos.front, overlayType: "body"    as const, hint: "Place the bands on shoulders, chest and waist" },
      { id: "side"  as const, label: "Side",  photoUrl: photos.side,  overlayType: "posture" as const, hint: "Place the top dot at the ear, bottom dot at the ankle" },
      { id: "back"  as const, label: "Back",  photoUrl: photos.back,  overlayType: "none"    as const, hint: "Back view — lat & shoulder reference" },
      { id: "face"  as const, label: "Face",  photoUrl: photos.face,  overlayType: "none"    as const, hint: "Face & jawline reference" },
    ] as (StepDef & { photoUrl: string | null })[]
  ).filter((s): s is StepDef => s.photoUrl !== null);

  const [stepIdx, setStepIdx] = useState(0);
  const [points,  setPoints]  = useState<OverlayPoints>(initialPoints ?? DEFAULT_POINTS);
  const [saving,  setSaving]  = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(initialMetrics ? new Date() : null);
  const [error,   setError]   = useState<string | null>(null);

  const currentStep = steps[stepIdx];
  const isFirst     = stepIdx === 0;
  const isLast      = stepIdx === steps.length - 1;
  const metrics     = computeMetrics(points, bio);

  // BF% range — computed separately to show honest uncertainty instead of a false-precise single number
  const bfEstimate = bio ? (() => {
    try {
      return estimateMaleBodyFat({
        age: bio.age, heightCm: bio.height_cm, weightKg: bio.weight_kg,
        waistCm: bio.waist_cm,
      });
    } catch { return null; }
  })() : null;

  const handleSave = useCallback(async () => {
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
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }, [points, metrics, userId]);

  const handleFinish = useCallback(async () => {
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
        setSaving(false);
      } else {
        router.push(`/admin/orders/${userId}`);
      }
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }, [points, metrics, userId, router]);

  if (steps.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ash">
        <p className="text-[13px] text-mute">No photos uploaded by this client yet.</p>
        <Link href={`/admin/orders/${userId}`} className="text-[12px] font-semibold text-void underline">
          ← Back to order
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0e0e0f]">

      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href={`/admin/orders/${userId}`}
            className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white"
          >
            ← Back
          </Link>
          <p className="text-[13px] font-semibold text-white">{userName}</p>
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIdx(i)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                i === stepIdx
                  ? "bg-white text-[#0e0e0f]"
                  : i < stepIdx
                  ? "text-emerald-400 hover:text-white"
                  : "text-white/30 hover:text-white/70"
              }`}
            >
              {i < stepIdx ? "✓ " : ""}{s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {savedAt && (
            <p className="text-[11px] text-emerald-400">
              Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {currentStep.overlayType !== "none" && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-white/20 px-4 py-1.5 text-[11px] font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
          <button
            onClick={handleFinish}
            disabled={saving}
            className="rounded-lg bg-white px-4 py-1.5 text-[11px] font-semibold text-[#0e0e0f] transition-colors hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & return →"}
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Photo area */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
          {/* Wrapper sizes itself to the image — SVG overlay matches exactly */}
          <div className="relative inline-flex max-h-full max-w-full rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentStep.photoUrl}
              alt={currentStep.label}
              className="block max-h-full max-w-full"
              style={{ maxHeight: "calc(100vh - 72px)" }}
              draggable={false}
            />
            {currentStep.overlayType === "body" && (
              <OverlaySvg points={points} onPointsChange={setPoints} />
            )}
            {currentStep.overlayType === "posture" && (
              <PostureOverlaySvg points={points} onPointsChange={setPoints} pas={metrics.pas} />
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex w-[320px] flex-col border-l border-white/10 bg-[#161618]">

          {/* Step info */}
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Step {stepIdx + 1} / {steps.length}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-white">{currentStep.label} photo</p>
            <p className="mt-1 text-[11px] text-white/40">{currentStep.hint}</p>
            {currentStep.overlayType !== "none" && (
              <button
                onClick={() => setPoints(DEFAULT_POINTS)}
                className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 transition-colors hover:text-white/60"
              >
                Reset bands
              </button>
            )}
          </div>

          {/* Metrics */}
          <div className="border-b border-white/10 px-6 py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Body metrics</p>
              {bfEstimate ? (
                <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                  BF% — {bfEstimate.anchorModel}
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-white/30">
                  BF% — no bio data
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {METRIC_DEFS.map(({ key, label, abbr, rec, fmt }) => {
                const value  = metrics[key];
                const status = metricStatus(key, value);
                const isBf   = key === "bf";

                // BF% shows a range rather than a false-precise single number
                const bfRange = isBf && bfEstimate
                  ? `${Math.round(bfEstimate.pointEstimate - 2)}–${Math.round(bfEstimate.pointEstimate + 2)}%`
                  : null;
                const bfTitle = isBf && bfEstimate
                  ? `Point estimate: ${bfEstimate.pointEstimate}% · Confidence: ${bfEstimate.confidence} · ${bfEstimate.anchorModel}`
                  : undefined;

                return (
                  <div key={key} className="rounded-lg bg-white/5 px-2 py-2 text-center" title={bfTitle}>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/35">
                      {abbr}{isBf && !bfEstimate ? " ~" : ""}
                    </p>
                    {bfRange ? (
                      <p className={`mt-0.5 text-[11px] font-semibold tabular-nums leading-none ${
                        status === "good" ? "text-emerald-400" : status === "warn" ? "text-amber-400" : "text-red-400"
                      }`}>
                        {bfRange}
                      </p>
                    ) : (
                      <p className={`mt-0.5 text-[14px] font-semibold tabular-nums leading-none ${
                        status === "good" ? "text-emerald-400" : status === "warn" ? "text-amber-400" : "text-red-400"
                      }`}>
                        {fmt(value)}
                      </p>
                    )}
                    <p className="mt-0.5 text-[9px] leading-tight text-white/25">{label}</p>
                  </div>
                );
              })}
            </div>
            {currentStep.overlayType === "none" && (
              <p className="mt-3 text-[10px] text-white/30">
                Calibrate the front photo to update these values.
              </p>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg bg-red-900/40 px-3 py-2 text-[12px] text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-auto flex gap-2 border-t border-white/10 px-6 py-5">
            <button
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="flex-1 rounded-lg border border-white/10 py-2.5 text-[12px] font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Prev
            </button>
            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 rounded-lg bg-white py-2.5 text-[12px] font-semibold text-[#0e0e0f] transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Finish →"}
              </button>
            ) : (
              <button
                onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                className="flex-1 rounded-lg border border-white/10 py-2.5 text-[12px] font-semibold text-white/60 transition-colors hover:border-white/25 hover:text-white"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

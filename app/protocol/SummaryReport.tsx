"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  computeAttractivenessScore,
  computeRealisticPotential,
  getAgeRanges,
  bfRealisticTarget,
  muscleGainMultiplier,
} from "../../lib/attractivenessScore";
import type { CalibrationMetrics } from "../admin/orders/[userId]/PhotoCalibrator";

// ── Types ────────────────────────────────────────────────────────────────────

interface SummaryReportProps {
  firstName:           string;
  age?:                number;
  deliveredDate:       string | null;
  metrics:             CalibrationMetrics;
  summary:             string | null;
  beforeUrl:           string | null;
  afterUrl:            string | null;
  weightKg?:           number;
  isAdmin:             boolean;
  generating:          boolean;
  genError:            string | null;
  genSummary:          boolean;
  summaryError:        string | null;
  onGenerate:          () => void;
  onGenerateSummary:   () => void;
  userId:              string;
  photoFront:          string | null;
  onRegenerate:        () => void;
}

// ── Score label mapping ───────────────────────────────────────────────────────

const SCORE_BANDS: [number, number, string][] = [
  [0,   30,  "Needs Work"],
  [30,  50,  "Below Avg"],
  [50,  65,  "Average"],
  [65,  80,  "Above Avg"],
  [80,  92,  "High"],
  [92,  100, "Elite"],
  [100, 101, "Perfect"],
];

function scoreLabel(score: number): string {
  return SCORE_BANDS.find(([a, b]) => score >= a && score < b)?.[2] ?? "Needs Work";
}

function scoreLabelColor(label: string): string {
  if (label === "Needs Work") return "#9a4040";
  if (label === "Below Avg")  return "#8a5c30";
  if (label === "Average")    return "#7f949b";
  if (label === "Above Avg")  return "#4a7a5e";
  if (label === "High")       return "#4a7a5e";
  return "#4a7a5e"; // Elite
}

function scoreLabelBg(label: string): string {
  if (label === "Needs Work") return "rgba(154, 64, 64, 0.08)";
  if (label === "Below Avg")  return "rgba(138, 92, 48, 0.08)";
  if (label === "Average")    return "rgba(127, 148, 155, 0.10)";
  if (label === "Above Avg")  return "rgba(74, 122, 94, 0.10)";
  if (label === "High")       return "rgba(74, 122, 94, 0.10)";
  return "rgba(74, 122, 94, 0.12)"; // Elite
}

// ── Metric flag ───────────────────────────────────────────────────────────────

function metricFlag(
  key: keyof CalibrationMetrics,
  value: number,
  ranges: Record<keyof CalibrationMetrics, [number, number]>,
): "ok" | "warn" | "bad" {
  const [min, max] = ranges[key];
  if (key === "bf") {
    if (value <= max) return "ok";
    const overshoot = value - max;
    const span = max - min;
    return overshoot / span < 0.5 ? "warn" : "bad";
  }
  if (value >= min && value <= max) return "ok";
  const gap = value < min ? min - value : value - max;
  const span = max - min;
  return gap / span < 0.5 ? "warn" : "bad";
}

const FLAG_COLORS = { ok: "#4a7a5e", warn: "#eb850a", bad: "#9a4040" } as const;

// ── Comparison Slider (inline) ─────────────────────────────────────────────

function ComparisonSlider({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    setPosition(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromX(e.clientX);
  };

  const releaseCapture = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", height: "min(72vh, 640px)", aspectRatio: "3/4", maxWidth: "100%", overflow: "hidden", cursor: "ew-resize", userSelect: "none", touchAction: "none", background: "#000" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={releaseCapture}
      onPointerCancel={releaseCapture}
    >
      {/* Before */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${beforeSrc})`, backgroundSize: "cover", backgroundPosition: "top center" }} />

      {/* After — clipped from left */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${afterSrc})`, backgroundSize: "cover", backgroundPosition: "top center", clipPath: `inset(0 0 0 ${position}%)` }} />

      {/* Tags */}
      <div style={{ position: "absolute", top: 20, left: 20, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "6px 12px", fontFamily: '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#253239", pointerEvents: "none" }}>
        Before · today
      </div>
      <div style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderRadius: 6, padding: "6px 12px", fontFamily: '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#253239", pointerEvents: "none" }}>
        After · week 12
      </div>

      {/* Divider */}
      <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.9)", left: `${position}%`, transform: "translateX(-50%)", pointerEvents: "none", boxShadow: "0 0 24px rgba(0,0,0,0.2)" }} />

      {/* Handle */}
      <div style={{ position: "absolute", top: "50%", left: `${position}%`, transform: "translate(-50%, -50%)", width: 44, height: 44, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#253239", boxShadow: "0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)", pointerEvents: "none" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6L3 12L9 18M15 6L21 12L15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SummaryReport({
  firstName,
  age,
  deliveredDate,
  metrics,
  summary,
  beforeUrl,
  afterUrl,
  weightKg,
  isAdmin,
  generating,
  genError,
  genSummary,
  summaryError,
  onGenerate,
  onGenerateSummary,
  photoFront,
  onRegenerate,
}: SummaryReportProps) {
  const effectiveAge = age ?? 30;
  const { score, label } = computeAttractivenessScore(metrics, effectiveAge);
  const { max: potentialScore, label: potentialLabel } = computeRealisticPotential(metrics, effectiveAge);
  const ageRanges = getAgeRanges(effectiveAge);
  const bfTarget = bfRealisticTarget(metrics.bf, effectiveAge);
  const gainMult = muscleGainMultiplier(effectiveAge);

  const r2 = (v: number) => Math.round(v * 100) / 100;
  const swrTarget = r2(metrics.swr + Math.max(0, ageRanges.swr[0] - metrics.swr) * gainMult);
  const cwrTarget = r2(metrics.cwr + Math.max(0, ageRanges.cwr[0] - metrics.cwr) * gainMult);
  const tiTarget  = r2(metrics.ti  + Math.max(0, ageRanges.ti[0]  - metrics.ti)  * gainMult);
  const pasTarget = Math.min(92, metrics.pas + Math.round(20 * Math.min(gainMult + 0.2, 1)));
  const delta = potentialScore - score;

  // Target weight
  const targetWeight = weightKg != null
    ? Math.round((weightKg * (1 - metrics.bf / 100)) / (1 - bfTarget / 100))
    : null;

  // Score display label
  const nowLabel = scoreLabel(score);
  const potLabel = scoreLabel(potentialScore);
  const nowLabelColor = scoreLabelColor(nowLabel);
  const nowLabelBg    = scoreLabelBg(nowLabel);

  // Metric gaps for analysis
  const metricGaps = [
    { key: "swr", gap: Math.max(0, ageRanges.swr[0] - metrics.swr) / (ageRanges.swr[0] || 1), label: "V-taper — Shoulders",  value: `SWR ${metrics.swr} → ${swrTarget}`, desc: "Shoulder-waist ratio: targeted upper body development." },
    { key: "cwr", gap: Math.max(0, ageRanges.cwr[0] - metrics.cwr) / (ageRanges.cwr[0] || 1), label: "Chest development",      value: `CWR ${metrics.cwr} → ${cwrTarget}`, desc: "Chest-waist ratio: upper body mass and width." },
    { key: "bf",  gap: Math.max(0, metrics.bf - ageRanges.bf[1])   / (ageRanges.bf[1] || 1),  label: "Body fat",               value: `${+metrics.bf.toFixed(2)}% → ${bfTarget}%`,      desc: "Central fat reduction — compounds proportionally." },
    { key: "pas", gap: Math.max(0, ageRanges.pas[0] - metrics.pas) / (ageRanges.pas[0] || 1), label: "Posture correction",     value: `PAS ${metrics.pas} → ${pasTarget}`,  desc: "Alignment score: upright stance and bearing." },
    { key: "ti",  gap: Math.max(0, ageRanges.ti[0]  - metrics.ti)  / (ageRanges.ti[0] || 1),  label: "Waist taper",            value: `TI ${metrics.ti} → ${tiTarget}`,     desc: "Taper index: visual narrowing of midsection." },
  ].sort((a, b) => b.gap - a.gap);

  const primaryLever   = metricGaps[0];
  const secondaryLever = metricGaps[1];

  // Parse summary
  const paragraphs    = summary ? summary.split(/\n\n+/).filter(p => !p.trimStart().startsWith('#')) : [];
  const lede          = paragraphs[0] ?? null;
  const bodyParagraphs = paragraphs.slice(1);

  // Mobile viewport detection (for scale bar overlap threshold)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);


  // Metric definitions for breakdown grid
  const breakdownMetrics: { key: keyof CalibrationMetrics; abbr: string; name: string; value: string; targetLabel: string; targetValue: string }[] = [
    { key: "swr", abbr: "SWR", name: "Shoulder-to-Waist Ratio",  value: String(metrics.swr), targetLabel: "Target", targetValue: String(swrTarget) },
    { key: "cwr", abbr: "CWR", name: "Chest-to-Waist Ratio",     value: String(metrics.cwr), targetLabel: "Target", targetValue: String(cwrTarget) },
    { key: "bf",  abbr: "BF%", name: "Body Fat Percentage",      value: `${+metrics.bf.toFixed(2)}%`, targetLabel: "Target", targetValue: `${bfTarget}%` },
    { key: "pas", abbr: "PAS", name: "Posture Alignment Score",  value: String(metrics.pas), targetLabel: "Target", targetValue: `≥ ${pasTarget}` },
    { key: "ti",  abbr: "TI",  name: "Taper Index",              value: String(metrics.ti),  targetLabel: "Target", targetValue: String(tiTarget) },
    { key: "pc",  abbr: "PC",  name: "Proportional Composite",   value: String(metrics.pc),  targetLabel: "Range",  targetValue: `${ageRanges.pc[0]}–${ageRanges.pc[1]}` },
  ];

  // ── Fonts ──────────────────────────────────────────────────────────────────
  const fontDisplay = '"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif';
  const fontMono    = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';
  const fontSans    = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';

  return (
    <div style={{ background: "#f9fbfb", fontFamily: fontSans, color: "#253239", minHeight: "100vh", overflowX: "hidden" }}>
      <style suppressHydrationWarning>{`
        @media print {
          .summary-report-admin-only { display: none !important; }
          .summary-report-topbar-actions { display: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .summary-drop-cap p:first-of-type::first-letter {
          font-family: "Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif;
          font-size: 64px; float: left; line-height: 0.9;
          color: #253239; padding: 6px 10px 0 0; font-weight: 400;
        }

        /* ── Layout classes ── */
        .sr-topbar     { display:flex; align-items:center; justify-content:space-between; padding:20px 56px; border-bottom:1px solid #edf0f1; }
        .sr-content    { max-width:1100px; margin:0 auto; padding:40px 56px 96px; }
        .sr-hero       { display:grid; grid-template-columns:1.2fr 1fr; gap:48px; align-items:end; padding-bottom:44px; margin-bottom:8px; }
        .sr-score-grid { display:grid; grid-template-columns:1.4fr 1fr; }
        .sr-score-cell { padding:44px 48px; }
        .sr-score-num  { font-size:156px; }
        .sr-scale      { padding:32px 48px 36px; border-top:1px solid #edf0f1; }
        .sr-breakdown  { display:grid; grid-template-columns:repeat(6,1fr); border-top:1px solid #edf0f1; background:#f9fbfb; }
        .sr-breakdown-cell { padding:24px 20px 22px; }
        .sr-section-hd { display:flex; align-items:baseline; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid #253239; margin:80px 0 28px; }
        .sr-stats-bar  { display:grid; grid-template-columns:repeat(4,1fr); padding:18px 28px; border-top:1px solid #edf0f1; background:#f9fbfb; gap:24px; }
        .sr-article    { background:#fff; border:1px solid #edf0f1; border-radius:20px; padding:64px 72px; position:relative; }
        .sr-article-hd { display:flex; align-items:baseline; justify-content:space-between; padding-bottom:20px; border-bottom:1px solid #edf0f1; margin-bottom:40px; }
        .sr-article-h2 { font-size:40px; }
        .sr-callout    { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; margin:44px 0 40px; padding:28px 0; border-top:1px solid #edf0f1; border-bottom:1px solid #edf0f1; }
        .sr-callout-c1 { padding:0 28px 0 0; border-right:1px solid #edf0f1; }
        .sr-callout-c2 { padding:0 28px; border-right:1px solid #edf0f1; }
        .sr-callout-c3 { padding:0 0 0 28px; }
        .sr-cta        { margin-top:48px; background:#253239; color:#fff; border-radius:20px; padding:48px 56px; display:grid; grid-template-columns:1fr auto; gap:32px; align-items:center; position:relative; overflow:hidden; }
        .sr-empty-pad  { padding:48px 56px; }

        @media (max-width: 768px) {
          .summary-drop-cap p:first-of-type::first-letter { font-size: 40px; padding: 4px 8px 0 0; }

          .sr-topbar         { padding:12px 16px; gap:8px; }
          .sr-topbar-crumb   { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
          .sr-btn-label      { display:inline; }
          .sr-topbar-btn     { padding:8px !important; min-width:44px; min-height:44px; justify-content:center; }
          .summary-report-topbar-actions { gap:6px !important; flex-shrink:0; }
          .sr-export-btn     { display:none; }
          .sr-content { padding:24px 16px 0; padding-bottom:calc(80px + max(12px, env(safe-area-inset-bottom))); }

          .sr-hero    { grid-template-columns:1fr; gap:20px; padding-bottom:28px; }
          .sr-hero-meta { display:none; }

          .sr-score-grid { grid-template-columns:1fr; }
          .sr-score-cell { padding:24px 20px !important; border-right:none !important; border-bottom:1px solid #edf0f1; }
          .sr-score-cell:last-child { border-bottom:none; }
          .sr-score-num  { font-size:72px; }

          .sr-delta-row  { flex-direction:column !important; align-items:flex-start !important; gap:4px !important; }
          .sr-delta-num  { font-size:28px !important; }

          .sr-scale  { padding:20px 16px 24px; }
          .sr-scale-legend { display:none; }
          .sr-scale-zone-label { display:none; }

          .sr-breakdown { grid-template-columns:repeat(3,1fr); }
          .sr-breakdown-cell { padding:16px 12px 14px; }
          .sr-breakdown-cell:nth-child(3n) { border-right:none !important; }
          .sr-breakdown-cell:nth-child(n+4) { border-top:1px solid #edf0f1; }
          .sr-breakdown-val { font-size:28px !important; }

          .sr-section-hd { margin:48px 0 20px; }
          .sr-section-hd-date  { display:none; }
          .sr-section-hd-label { max-width:calc(100% - 20px); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

          .sr-stats-bar { grid-template-columns:repeat(2,1fr); padding:14px 16px; gap:16px; }
          .sr-stats-bar > div { min-width:0; overflow:hidden; }
          .sr-stats-val { font-size:12px !important; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

          .sr-front-btn  { min-height:44px; }

          .sr-article    { padding:24px 20px; }
          .sr-article-hd { flex-direction:column; gap:12px; }
          .sr-article-h2 { font-size:24px; }

          .sr-lede { font-size:18px !important; line-height:1.6 !important; }

          .sr-callout    { grid-template-columns:1fr; }
          .sr-callout-c1 { padding:0 0 20px 0; border-right:none; border-bottom:1px solid #edf0f1; }
          .sr-callout-c2 { padding:20px 0; border-right:none; border-bottom:1px solid #edf0f1; }
          .sr-callout-c3 { padding:20px 0 0 0; }
          .sr-callout-hd { font-size:22px !important; }

          .sr-cta { padding:32px 20px; grid-template-columns:1fr; gap:20px; text-align:left; }
          .sr-cta-btn { width:100%; min-height:44px; justify-content:center; display:flex; }
          .sr-cta-btn:active { opacity:0.8; }

          .sr-empty-pad { padding:28px 20px; }

          .sr-sticky-cta { display:flex; position:fixed; bottom:0; left:0; right:0; z-index:30; padding:12px 16px; padding-bottom:max(12px,env(safe-area-inset-bottom)); background:#253239; border-top:1px solid rgba(255,255,255,0.1); align-items:center; justify-content:center; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="sr-topbar">
        <div className="sr-topbar-crumb" style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097" }}>
          Protocol <span style={{ color: "#9eb1b8", margin: "0 8px" }}>/</span>
          {firstName} <span style={{ color: "#9eb1b8", margin: "0 8px" }}>/</span>
          Summary Report
        </div>
        <div className="summary-report-topbar-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => window.print()}
            className="sr-topbar-btn sr-export-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", fontSize: 12, color: "#515255", background: "#fff", border: "1px solid #dfe4e6", borderRadius: 6, cursor: "pointer" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3V15M12 15L7 10M12 15L17 10M4 21H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="sr-btn-label">Export PDF</span>
          </button>
        </div>
      </div>

      {/* ── INNER CONTENT (max-width 1100px centered) ── */}
      <div className="sr-content">

        {/* ── HERO ── */}
        <div className="sr-hero">
          <div>
            <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#799097", marginBottom: 14 }}>
              Protocol · 12-week plan
            </div>
            <h1 style={{ fontFamily: fontDisplay, fontSize: "clamp(44px, 6vw, 76px)", fontWeight: 400, lineHeight: 0.98, letterSpacing: "-0.03em", margin: 0, color: "#253239" }}>
              Summary<br />
              <em style={{ fontStyle: "italic", color: "#9eb1b8" }}>Report.</em>
            </h1>
          </div>
          <div className="sr-hero-meta" style={{ textAlign: "right", fontFamily: fontMono, fontSize: 11, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.7 }}>
            <div style={{ display: "flex", gap: 24, justifyContent: "flex-end" }}>
              <div>
                <span>Subject</span>
                <b style={{ display: "block", color: "#253239", fontWeight: 500, fontSize: 13, marginTop: 2, letterSpacing: "0.04em" }}>
                  {firstName}{age != null ? `, ${age}` : ""}
                </b>
              </div>
              <div>
                <span>Measured</span>
                <b style={{ display: "block", color: "#253239", fontWeight: 500, fontSize: 13, marginTop: 2, letterSpacing: "0.04em" }}>
                  {deliveredDate ?? "—"}
                </b>
              </div>
              <div>
                <span>Plan</span>
                <b style={{ display: "block", color: "#253239", fontWeight: 500, fontSize: 13, marginTop: 2, letterSpacing: "0.04em" }}>
                  12 weeks
                </b>
              </div>
            </div>
          </div>
        </div>

        {/* ── SCORE BLOCK ── */}
        <div style={{ background: "#fff", border: "1px solid #edf0f1", borderRadius: 20, overflow: "hidden", marginBottom: 36 }}>

          {/* Top grid: now + potential */}
          <div className="sr-score-grid">

            {/* Now */}
            <div className="sr-score-cell" style={{ borderRight: "1px solid #edf0f1", position: "relative" }}>
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097", display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                Physical Attractiveness Score
                <span style={{ fontFamily: fontMono, fontSize: 10, padding: "3px 8px", border: "1px solid #dfe4e6", borderRadius: 999, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Age {effectiveAge}
                </span>
              </div>
              <div style={{ fontFamily: fontDisplay, fontWeight: 400, lineHeight: 0.85, letterSpacing: "-0.04em", display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="sr-score-num" style={{ color: "#253239" }}>{score}</span>
                <span style={{ fontFamily: fontMono, fontSize: 22, color: "#9eb1b8", letterSpacing: "-0.01em", fontWeight: 400 }}>/ 100</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, padding: "6px 12px", borderRadius: 999, fontFamily: fontSans, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", background: nowLabelBg, color: nowLabelColor }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: nowLabelColor, display: "inline-block" }} />
                {nowLabel}
              </div>
              <div style={{ fontSize: 13, color: "#7f949b", marginTop: 16, lineHeight: 1.5, maxWidth: 340 }}>
                Raw composite. Age-calibrated against peers.
              </div>
            </div>

            {/* Potential */}
            <div className="sr-score-cell" style={{ background: "#253239", color: "#fff", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top right, rgba(255,255,255,0.06), transparent 60%), radial-gradient(ellipse at bottom left, rgba(255,255,255,0.03), transparent 60%)", pointerEvents: "none" }} />
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 10, marginBottom: 28, position: "relative", zIndex: 1 }}>
                Realistic Potential
                <span style={{ fontFamily: fontMono, fontSize: 10, padding: "3px 8px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  12-wk horizon
                </span>
              </div>
              <div style={{ fontFamily: fontDisplay, fontWeight: 400, lineHeight: 0.85, letterSpacing: "-0.04em", display: "flex", alignItems: "baseline", gap: 6, position: "relative", zIndex: 1 }}>
                <span className="sr-score-num" style={{ color: "#fff" }}>{potentialScore}</span>
                <span style={{ fontFamily: fontMono, fontSize: 22, color: "rgba(255,255,255,0.5)", letterSpacing: "-0.01em", fontWeight: 400 }}>/ 100</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, padding: "6px 12px", borderRadius: 999, fontFamily: fontSans, fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(255,255,255,0.12)", color: "#fff", position: "relative", zIndex: 1 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                {potLabel}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 16, lineHeight: 1.5, position: "relative", zIndex: 1 }}>
                Achievable with the Protocol over 84 days.
              </div>
              {/* Delta */}
              <div className="sr-delta-row" style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "baseline", justifyContent: "space-between", fontFamily: fontMono, fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", position: "relative", zIndex: 1 }}>
                <span>Projected gain</span>
                <b className="sr-delta-num" style={{ fontFamily: fontDisplay, fontSize: 40, color: "#fff", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, fontStyle: "italic" }}>
                  {delta >= 0 ? "+" : ""}{delta}
                </b>
              </div>
            </div>
          </div>

          {/* Scale bar */}
          <div className="sr-scale">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097" }}>
                Where you sit ·{" "}
                <span style={{ color: "#9eb1b8", textTransform: "none", letterSpacing: "0.02em" }}>age-adjusted distribution</span>
              </div>
              <div className="sr-scale-legend" style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ● current &nbsp;·&nbsp; ○ target
              </div>
            </div>

            {/* Score labels row — above the track, absolutely positioned */}
            <div style={{ position: "relative", height: 28, marginBottom: 4 }}>
              {/* NOW label */}
              <div style={{
                position: "absolute",
                left: `${Math.max(2, Math.min(94, score))}%`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}>
                <div style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 600, color: "#9a4040", letterSpacing: "-0.01em", lineHeight: 1 }}>{score}</div>
                <div style={{ fontFamily: fontMono, fontSize: 9, color: "#9a4040", textTransform: "uppercase", letterSpacing: "0.1em" }}>now</div>
              </div>
              {/* TARGET label — only if far enough from NOW (higher threshold on mobile to prevent overlap) */}
              {Math.abs(potentialScore - score) >= (isMobile ? 14 : 8) && (
                <div style={{
                  position: "absolute",
                  left: `${Math.max(6, Math.min(98, potentialScore))}%`,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}>
                  <div style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 600, color: "#253239", letterSpacing: "-0.01em", lineHeight: 1 }}>{potentialScore}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 9, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.1em" }}>target</div>
                </div>
              )}
            </div>

            {/* Track */}
            <div style={{ position: "relative", height: 10, borderRadius: 999, background: "linear-gradient(90deg, #e8d8d8 0%, #e8dcc8 25%, #d8e3d0 50%, #c8dbd2 75%, #b8d0cc 100%)" }}>
              {/* Zone dividers */}
              <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "35fr 20fr 20fr 15fr 10fr", pointerEvents: "none" }}>
                {[0,1,2,3,4].map(i => <div key={i} style={{ borderRight: i < 4 ? "1px solid rgba(255,255,255,0.6)" : "none" }} />)}
              </div>
              {/* Markers — dots only, no labels */}
              <ScaleMarker position={score} variant="now" />
              <ScaleMarker position={potentialScore} variant="target" />
            </div>

            {/* Zone labels row — below the track */}
            <div style={{ display: "flex", marginTop: 10, fontFamily: fontSans, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: "#aab8bc" }}>
              {/* 0 aligns left edge */}
              <div style={{ width: "0%", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, whiteSpace: "nowrap" }}>0</span>
              </div>
              {/* Zone labels centered in their zones */}
              {/* Needs Work: 0–35, Average: 35–55, Above: 55–75, High: 75–90, Elite: 90–100 */}
              <div className="sr-scale-zone-label" style={{ flex: "35 0 0%", textAlign: "center" }}>Needs Work</div>
              <div className="sr-scale-zone-label" style={{ flex: "20 0 0%", textAlign: "center" }}>Average</div>
              <div className="sr-scale-zone-label" style={{ flex: "20 0 0%", textAlign: "center" }}>Above</div>
              <div className="sr-scale-zone-label" style={{ flex: "15 0 0%", textAlign: "center" }}>High</div>
              <div className="sr-scale-zone-label" style={{ flex: "10 0 0%", textAlign: "center" }}>Elite</div>
            </div>
          </div>

          {/* Breakdown grid */}
          <div className="sr-breakdown">
            {breakdownMetrics.map(({ key, abbr, name, value, targetLabel, targetValue }, i) => {
              const flag = metricFlag(key, metrics[key], ageRanges);
              const flagColor = FLAG_COLORS[flag];
              return (
                <div key={key} className="sr-breakdown-cell" style={{ borderRight: i < 5 ? "1px solid #edf0f1" : "none", position: "relative" }}>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {abbr}
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: flagColor }} />
                  </div>
                  <div className="sr-breakdown-val" style={{ fontFamily: fontDisplay, fontSize: 36, fontWeight: 400, lineHeight: 1, color: "#253239", letterSpacing: "-0.02em", marginBottom: 6 }}>
                    {key === "bf" ? (
                      <>{value}<sup style={{ fontSize: 14, color: "#9eb1b8", fontFamily: fontMono, verticalAlign: "super", letterSpacing: "-0.02em" }}>%</sup></>
                    ) : value}
                  </div>
                  <div style={{ fontSize: 12, color: "#515255", lineHeight: 1.4, marginBottom: 14 }}>{name}</div>
                  <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.06em", paddingTop: 12, borderTop: "1px dashed #dfe4e6", display: "flex", justifyContent: "space-between" }}>
                    <span>{targetLabel}</span>
                    <b style={{ color: "#253239", fontWeight: 500 }}>{targetValue}</b>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BEFORE / AFTER SECTION ── */}
        <div className="sr-section-hd">
          <div className="sr-section-hd-label" style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#253239", fontWeight: 500 }}>
            Before · After
          </div>
          <div className="sr-section-hd-date" style={{ fontFamily: fontMono, fontSize: 11, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {deliveredDate ?? "—"} → projected week 12
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #edf0f1", borderRadius: 20, overflow: "hidden", marginBottom: 36 }}>
          {/* Card head */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid #edf0f1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: fontSans, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097" }}>
              Visual reference
              <div style={{ display: "flex", gap: 4, background: "#f9fbfb", borderRadius: 8, padding: 3 }}>
                <button className="sr-front-btn" style={{ padding: "6px 12px", fontFamily: fontSans, fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#253239", background: "#fff", border: 0, borderRadius: 5, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  Front
                </button>
              </div>
            </div>
            <div style={{ fontFamily: fontMono, fontSize: 11, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {deliveredDate ?? "—"}
            </div>
          </div>

          {/* Viewer */}
          {afterUrl ? (
            <div style={{ display: "flex", justifyContent: "center", background: "#000" }}>
              <ComparisonSlider beforeSrc={beforeUrl ?? photoFront ?? ""} afterSrc={afterUrl} />
            </div>
          ) : photoFront ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div style={{ display: "flex", justifyContent: "center", background: "#000" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoFront}
                  alt="Front photo"
                  style={{ height: "min(72vh, 640px)", aspectRatio: "3/4", maxWidth: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                />
              </div>
              {isAdmin && (
                <div className="summary-report-admin-only" style={{ padding: "24px 28px", borderTop: "1px solid #edf0f1", background: "#f9fbfb" }}>
                  <button
                    onClick={onGenerate}
                    disabled={generating}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#253239", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1 }}
                  >
                    {generating ? (
                      <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating…</>
                    ) : "Generate Before/After"}
                  </button>
                  {genError && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{genError}</p>}
                </div>
              )}
              {!isAdmin && (
                <div style={{ padding: "24px 28px", borderTop: "1px solid #edf0f1", background: "#f9fbfb", color: "#7f949b", fontSize: 13 }}>
                  Your before/after visualisation is being prepared.
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "48px 28px", textAlign: "center", color: "#7f949b", fontSize: 13 }}>
              No photo available.
            </div>
          )}

          {/* Stats bar */}
          <div className="sr-stats-bar">
            <div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Weight</div>
              <div className="sr-stats-val" style={{ fontFamily: fontMono, fontSize: 14, color: "#253239" }}>
                {weightKg != null && targetWeight != null ? `${weightKg} → ${targetWeight} kg` : "—"}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>SWR</div>
              <div className="sr-stats-val" style={{ fontFamily: fontMono, fontSize: 14, color: "#253239" }}>{metrics.swr} → {swrTarget}</div>
            </div>
            <div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Body Fat</div>
              <div className="sr-stats-val" style={{ fontFamily: fontMono, fontSize: 14, color: "#253239" }}>{metrics.bf}% → {bfTarget}%</div>
            </div>
            <div>
              <div style={{ fontFamily: fontMono, fontSize: 10, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Score</div>
              <div className="sr-stats-val" style={{ fontFamily: fontMono, fontSize: 14, color: "#253239" }}>{score} → {potentialScore}</div>
            </div>
          </div>

          {/* Admin: Regenerate (if afterUrl exists) */}
          {isAdmin && afterUrl && (
            <div className="summary-report-admin-only" style={{ padding: "16px 28px", borderTop: "1px solid #edf0f1" }}>
              <button
                onClick={onRegenerate}
                disabled={generating}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", color: "#515255", border: "1px solid #dfe4e6", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.5 : 1 }}
              >
                {generating ? (
                  <><span style={{ display: "inline-block", width: 12, height: 12, border: "1.5px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating…</>
                ) : "↻ Regenerate"}
              </button>
              {genError && <p style={{ marginTop: 8, fontSize: 12, color: "#9a4040" }}>{genError}</p>}
            </div>
          )}
        </div>

        {/* ── ANALYSIS SECTION ── */}
        <div className="sr-section-hd">
          <div className="sr-section-hd-label" style={{ fontFamily: fontSans, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#253239", fontWeight: 500 }}>
            Analysis
          </div>
          {isAdmin && (
            <div className="summary-report-admin-only" style={{ fontFamily: fontMono, fontSize: 11, color: "#7f949b" }}>
              <button
                onClick={onGenerateSummary}
                disabled={genSummary}
                style={{ background: "none", border: "none", cursor: genSummary ? "not-allowed" : "pointer", color: "#7f949b", fontSize: 11, fontFamily: fontMono, textTransform: "uppercase", letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {genSummary ? (
                  <><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Regenerating…</>
                ) : "↻ Regenerate"}
              </button>
            </div>
          )}
        </div>

        {summary ? (
          <article className="sr-article">
            {/* Head */}
            <div className="sr-article-hd">
              <h2 className="sr-article-h2" style={{ fontFamily: fontDisplay, fontWeight: 400, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 }}>
                Summary Report — <em style={{ fontStyle: "italic", color: "#9eb1b8" }}>{firstName}</em>
              </h2>
              <div style={{ fontFamily: fontMono, fontSize: 11, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right", lineHeight: 1.6 }}>
                Written for<br />
                <b style={{ color: "#253239", fontWeight: 500, fontFamily: fontDisplay, fontStyle: "italic", fontSize: 16, textTransform: "none", letterSpacing: "0.01em", display: "block" }}>{firstName}</b>
              </div>
            </div>

            {/* Lede */}
            {lede && (
              <p className="sr-lede" style={{ fontFamily: fontDisplay, fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.01em", color: "#253239", margin: "0 0 36px", maxWidth: 720 }}>
                {lede}
              </p>
            )}

            {/* Callout */}
            <div className="sr-callout">
              <div className="sr-callout-c1">
                <div style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097", marginBottom: 10 }}>Primary lever</div>
                <div className="sr-callout-hd" style={{ fontFamily: fontDisplay, fontSize: 28, color: "#253239", fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>{primaryLever.label}</div>
                <div style={{ fontSize: 13, color: "#7f949b", lineHeight: 1.5 }}>{primaryLever.value} — {primaryLever.desc}</div>
              </div>
              <div className="sr-callout-c2">
                <div style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097", marginBottom: 10 }}>Secondary lever</div>
                <div className="sr-callout-hd" style={{ fontFamily: fontDisplay, fontSize: 28, color: "#253239", fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>{secondaryLever.label}</div>
                <div style={{ fontSize: 13, color: "#7f949b", lineHeight: 1.5 }}>{secondaryLever.value} — {secondaryLever.desc}</div>
              </div>
              <div className="sr-callout-c3">
                <div style={{ fontFamily: fontSans, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097", marginBottom: 10 }}>Ceiling</div>
                <div className="sr-callout-hd" style={{ fontFamily: fontDisplay, fontSize: 28, color: "#253239", fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>
                  <em style={{ fontStyle: "italic", color: "#9eb1b8" }}>{potentialScore}</em>/100
                </div>
                <div style={{ fontSize: 13, color: "#7f949b", lineHeight: 1.5 }}>{potentialLabel} · realistic ceiling</div>
              </div>
            </div>

            {/* Body */}
            {bodyParagraphs.length > 0 && (
              <div className="summary-drop-cap" style={{ fontSize: 16, lineHeight: 1.7, color: "#515255", maxWidth: 720 }}>
                {bodyParagraphs.map((para, i) => (
                  <p key={i} style={{ margin: "0 0 22px" }}>{para}</p>
                ))}
              </div>
            )}

            {summaryError && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{summaryError}</p>}
          </article>
        ) : (
          <div className="sr-empty-pad" style={{ background: "#fff", border: "1px solid #edf0f1", borderRadius: 20 }}>
            {isAdmin ? (
              <div>
                <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 600, color: "#253239" }}>Generate Summary Report</p>
                <p style={{ marginBottom: 20, fontSize: 13, color: "#7f949b", lineHeight: 1.6 }}>
                  A personalized analysis of this client&apos;s metrics, gaps, and realistic potential.
                </p>
                <button
                  onClick={onGenerateSummary}
                  disabled={genSummary}
                  className="summary-report-admin-only"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#253239", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: genSummary ? "not-allowed" : "pointer", opacity: genSummary ? 0.6 : 1 }}
                >
                  {genSummary ? (
                    <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating…</>
                  ) : "Generate Analysis"}
                </button>
                {summaryError && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{summaryError}</p>}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "#7f949b" }}>Your analysis is being prepared.</p>
            )}
          </div>
        )}

        {/* ── NEXT STEP CTA ── */}
        <div className="sr-cta">
          <div style={{ position: "absolute", top: "-40%", right: "-10%", width: "60%", aspectRatio: "1", background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <button
              className="sr-cta-btn"
              onClick={() => window.dispatchEvent(new CustomEvent("protocol-navigate", { detail: "body-analysis" }))}
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 24px", background: "#fff", color: "#253239", fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", borderRadius: 999, border: 0, cursor: "pointer", textDecoration: "none" }}
            >
              View Body Analysis →
            </button>
          </div>
        </div>

      </div>

      {/* Sticky mobile CTA bar — hidden on desktop, shown via .sr-sticky-cta media query */}
      <div className="sr-sticky-cta" style={{ display: "none" }}>
        <button
          className="sr-cta-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("protocol-navigate", { detail: "body-analysis" }))}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 24px", background: "#fff", color: "#253239", fontSize: 14, fontWeight: 500, letterSpacing: "0.02em", borderRadius: 999, border: 0, cursor: "pointer" }}
        >
          View Body Analysis →
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Scale marker ──────────────────────────────────────────────────────────────

function ScaleMarker({ position, variant }: { position: number; variant: "now" | "target" }) {
  const isTarget = variant === "target";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: isTarget ? "#253239" : "#9a4040",
        border: "3px solid #fff",
        boxShadow: isTarget ? "0 2px 8px rgba(37,50,57,0.25)" : "0 2px 8px rgba(154,64,64,0.3)",
        transform: "translate(-50%, -50%)",
        left: `${Math.max(2, Math.min(98, position))}%`,
        transition: "left 0.6s ease",
      }}
    />
  );
}

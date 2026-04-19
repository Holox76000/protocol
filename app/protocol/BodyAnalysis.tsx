"use client";

import {
  computeAttractivenessScore,
  computeRealisticPotential,
  getAgeRanges,
} from "../../lib/attractivenessScore";
import type { CalibrationMetrics, OverlayPoints } from "../admin/orders/[userId]/PhotoCalibrator";
import { OC } from "../../lib/overlayColors";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  firstName:     string;
  age?:          number;
  deliveredDate: string | null;
  metrics:       CalibrationMetrics;
  points:        OverlayPoints | null;
  photoFront:    string | null;
  photoSide:     string | null;
  heightCm?:     number;
}

type Flag = "priority" | "improve" | "ok";

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeFlag(value: number, optMin: number, optMax: number, lowerIsBetter = false): Flag {
  if (lowerIsBetter) {
    if (value <= optMax) return "ok";
    return (value - optMax) / (optMax - optMin) < 0.5 ? "improve" : "priority";
  }
  if (value >= optMin) return "ok";
  return (optMin - value) / (optMax - optMin) < 0.5 ? "improve" : "priority";
}

function scalePos(value: number, min: number, max: number): string {
  return `${Math.max(2, Math.min(98, ((value - min) / (max - min)) * 100))}%`;
}

function optZone(oMin: number, oMax: number, sMin: number, sMax: number) {
  const span = sMax - sMin;
  return {
    left:  `${Math.max(0, ((oMin - sMin) / span) * 100)}%`,
    right: `${Math.max(0, (1 - (oMax - sMin) / span) * 100)}%`,
  };
}

const FLAG_LABEL:  Record<Flag, string> = { priority: "Priority", improve: "Improve", ok: "Ok" };
const FLAG_CLS:    Record<Flag, string> = { priority: "ba-flag--priority", improve: "ba-flag--improve", ok: "ba-flag--ok" };
const MARKER_CLS:  Record<Flag, string> = { priority: "ba-mkr--warn", improve: "ba-mkr--warn", ok: "ba-mkr--ok" };
const PRIO_CLS:    Record<Flag, string> = { priority: "ba-prio--priority", improve: "ba-prio--improve", ok: "ba-prio--ok" };
const PRIO_TEXT:   Record<Flag, string> = { priority: "PRIORITY", improve: "IMPROVE", ok: "OK" };

// ── Sub-components ────────────────────────────────────────────────────────────

function ScaleBar({
  value, scaleMin, scaleMax, optMin, optMax, f, labels,
}: {
  value: number; scaleMin: number; scaleMax: number;
  optMin: number; optMax: number; f: Flag; labels: [string, string, string, string, string];
}) {
  const zone = optZone(optMin, optMax, scaleMin, scaleMax);
  return (
    <div className="ba-scale">
      <div className="ba-scale-bar">
        <div className="ba-scale-opt" style={{ left: zone.left, right: zone.right }} />
        <div className={`ba-mkr ${MARKER_CLS[f]}`} style={{ left: scalePos(value, scaleMin, scaleMax) }} />
      </div>
      <div className="ba-scale-labels">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>{labels[2]}</span>
        <em>{labels[3]}</em>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

function ScanPhoto({
  src, alt, children, caption,
}: {
  src: string; alt: string; children?: React.ReactNode; caption: string;
}) {
  return (
    <figure className="ba-metric-media">
      <div className="ba-scan">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="ba-scan-img" />
        {children}
      </div>
      <figcaption className="ba-scan-caption">
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BodyAnalysis({
  firstName, age, deliveredDate, metrics, points, photoFront, photoSide, heightCm,
}: Props) {
  const effectiveAge = age ?? 30;
  const { score }    = computeAttractivenessScore(metrics, effectiveAge);
  const { max: pot } = computeRealisticPotential(metrics, effectiveAge);
  const delta        = pot - score;
  const ranges       = getAgeRanges(effectiveAge);

  const swrF = computeFlag(metrics.swr, ranges.swr[0], ranges.swr[1]);
  const cwrF = computeFlag(metrics.cwr, ranges.cwr[0], ranges.cwr[1]);
  const bfF  = computeFlag(metrics.bf,  ranges.bf[0],  ranges.bf[1],  true);
  const tiF  = computeFlag(metrics.ti,  ranges.ti[0],  ranges.ti[1]);
  const pasF = computeFlag(metrics.pas, ranges.pas[0], ranges.pas[1]);
  const pcF  = computeFlag(metrics.pc,  ranges.pc[0],  ranges.pc[1]);

  const fontD = '"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif';
  const fontM = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';
  const fontS = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';

  const scanId = deliveredDate
    ? `SCN–${deliveredDate.replace(/\s+/g, "·").replace(/,/g, "").toUpperCase()}`
    : "SCN–PENDING";

  const miniMetrics = [
    { code: "SWR", label: "Shoulder-to-Waist", val: metrics.swr.toFixed(2), f: swrF },
    { code: "CWR", label: "Chest-to-Waist",    val: metrics.cwr.toFixed(2), f: cwrF },
    { code: "BF%", label: "Body Fat",          val: `${metrics.bf}%`,        f: bfF  },
    { code: "TI",  label: "Taper Index",       val: metrics.ti.toFixed(2),   f: tiF  },
    { code: "PAS", label: "Posture Alignment", val: `${metrics.pas}/100`,     f: pasF },
    { code: "PC",  label: "Prop. Coherence",   val: `${metrics.pc}/100`,      f: pcF  },
  ];

  const priorityCount = [swrF, cwrF, bfF, tiF, pasF, pcF].filter(f => f === "priority").length;

  return (
    <div style={{ background: "#fff", fontFamily: fontS, color: "#253239", minHeight: "100vh", overflowX: "hidden" }}>
      <style suppressHydrationWarning>{`
        /* ── Container ── */
        .ba-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; }
        @media (min-width: 700px)  { .ba-container { padding: 0 40px; } }
        @media (min-width: 1100px) { .ba-container { padding: 0 64px; } }

        /* ── Mobile chip strip ── */
        .ba-chips { display: none; background: #fff; padding: 10px 20px;
          border-bottom: 1px solid #edf0f1; overflow-x: auto; gap: 6px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .ba-chips::-webkit-scrollbar { display: none; }
        @media (max-width: 900px) { .ba-chips { display: flex; } }
        .ba-chip { flex: 0 0 auto; font-family: ${fontM}; font-size: 11px;
          letter-spacing: 0.06em; text-transform: uppercase; color: #515255;
          padding: 7px 11px; border: 1px solid #dfe4e6; border-radius: 999px;
          text-decoration: none; background: #fff; white-space: nowrap; }
        .ba-chip:hover { border-color: #253239; color: #253239; }

        /* ── Report header ── */
        .ba-report-head { padding: 40px 0 32px; border-bottom: 1px solid #edf0f1; }
        @media (min-width: 700px) { .ba-report-head { padding: 64px 0 44px; } }
        .ba-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: #799097; margin: 0 0 14px;
          font-family: ${fontS}; }
        .ba-h1 { font-family: ${fontD}; font-size: clamp(40px, 7vw, 72px);
          font-weight: 400; letter-spacing: -0.025em; line-height: 1.02;
          margin: 0 0 18px; color: #253239; }
        .ba-h1 em { font-style: italic; color: #9eb1b8; }
        .ba-sub { font-size: clamp(15px, 1.5vw, 18px); line-height: 1.55;
          color: #515255; max-width: 680px; margin: 0; }
        .ba-meta { margin-top: 28px; display: grid;
          grid-template-columns: repeat(2, 1fr); gap: 14px 28px; max-width: 720px; }
        @media (min-width: 700px) { .ba-meta { grid-template-columns: repeat(4, 1fr); } }
        .ba-meta dt { font-family: ${fontS}; font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: #7f949b; margin: 0 0 4px; }
        .ba-meta dd { margin: 0; font-family: ${fontM}; font-size: 14px; color: #253239; }

        /* ── Composite ── */
        .ba-composite { padding: 32px 0 8px; display: grid; gap: 24px; grid-template-columns: 1fr; }
        @media (min-width: 900px) { .ba-composite { grid-template-columns: 1.2fr 1fr; gap: 40px; padding: 44px 0 16px; } }
        .ba-composite-label { font-family: ${fontS}; font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: #7f949b; margin: 0 0 8px; }
        .ba-composite-score { display: flex; align-items: baseline; gap: 16px; }
        .ba-big { font-family: ${fontD}; font-size: clamp(64px, 12vw, 128px);
          line-height: 0.9; letter-spacing: -0.04em; color: #253239; }
        .ba-denom { font-family: ${fontM}; font-size: 18px; color: #7f949b; letter-spacing: 0.02em; }
        .ba-delta { margin-left: auto; font-family: ${fontM}; font-size: 12px;
          letter-spacing: 0.06em; color: #4a7a5e; text-transform: uppercase;
          padding: 4px 8px; border: 1px solid rgba(74,122,94,0.3); border-radius: 4px; }
        .ba-composite-desc { font-size: 15px; line-height: 1.6; color: #515255; max-width: 520px; }
        .ba-composite-desc strong { font-weight: 500; color: #253239; }
        .ba-minigrid { display: grid; gap: 0; }
        .ba-minirow { display: grid; grid-template-columns: 40px 1fr auto;
          align-items: center; gap: 14px; padding: 10px 0;
          border-top: 1px solid #edf0f1; }
        .ba-minirow:last-child { border-bottom: 1px solid #edf0f1; }
        .ba-minirow-code { font-family: ${fontM}; font-size: 11px; color: #7f949b; letter-spacing: 0.08em; }
        .ba-minirow-label { font-size: 14px; color: #253239; }
        .ba-minirow-val { font-family: ${fontM}; font-size: 13px; color: #253239;
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .ba-prio { font-family: ${fontS}; font-size: 9px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; }
        .ba-prio--priority { color: #bb3030; border: 1px solid rgba(187,48,48,0.2); }
        .ba-prio--improve  { color: #eb850a; border: 1px solid rgba(235,133,10,0.2); }
        .ba-prio--ok       { color: #0c6826; border: 1px solid rgba(12,104,38,0.2); }

        /* ── Section header ── */
        .ba-section-top { display: flex; align-items: baseline; justify-content: space-between;
          padding: 56px 0 16px; border-bottom: 1px solid #253239;
          margin-bottom: 40px; gap: 20px; flex-wrap: wrap; }
        @media (min-width: 700px) { .ba-section-top { padding: 88px 0 16px; margin-bottom: 56px; } }
        .ba-section-top h2 { font-family: ${fontS}; font-size: 11px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: #253239; margin: 0; }
        .ba-count { font-family: ${fontM}; font-size: 11px; color: #7f949b; letter-spacing: 0.06em; }

        /* ── Metric card ── */
        .ba-metric { padding: 0 0 64px; scroll-margin-top: 72px; }
        .ba-metric + .ba-metric { padding-top: 24px; border-top: 1px solid #edf0f1; }
        .ba-metric-head { display: grid; grid-template-columns: 1fr auto;
          align-items: start; gap: 16px 24px; margin-bottom: 20px; }
        .ba-metric-title { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ba-metric-code { font-family: ${fontM}; font-size: 10px; letter-spacing: 0.12em;
          color: #7f949b; padding: 5px 8px; border: 1px solid #dfe4e6;
          border-radius: 4px; text-transform: uppercase; }
        .ba-metric-name { font-family: ${fontS}; font-weight: 500;
          font-size: clamp(20px, 3vw, 28px); letter-spacing: -0.01em; color: #253239; margin: 0; }
        .ba-metric-right { display: flex; align-items: center; gap: 10px; justify-self: end; }
        .ba-metric-value { font-family: ${fontD}; font-size: clamp(36px, 5vw, 56px);
          line-height: 1; letter-spacing: -0.03em; color: #253239; }
        .ba-metric-value .ba-unit { font-family: ${fontM}; font-size: 14px;
          color: #7f949b; letter-spacing: 0.02em; margin-left: 4px; }
        .ba-flag { font-family: ${fontS}; font-size: 10px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase; padding: 5px 9px; border-radius: 4px; }
        .ba-flag--priority { color: #bb3030; background: rgba(187,48,48,0.08); }
        .ba-flag--improve  { color: #eb850a; background: rgba(235,133,10,0.10); }
        .ba-flag--ok       { color: #0c6826; background: rgba(12,104,38,0.08); }

        /* ── Scale bar ── */
        .ba-scale { margin: 6px 0 20px; }
        .ba-scale-bar { position: relative; height: 6px; background: #edf0f1;
          border-radius: 3px; overflow: visible; }
        .ba-scale-opt { position: absolute; top: 0; bottom: 0;
          background: linear-gradient(90deg, #b5d9c6 0%, #8ec0a4 50%, #b5d9c6 100%);
          border-radius: 3px; }
        .ba-mkr { position: absolute; top: 50%; width: 14px; height: 14px;
          border-radius: 50%; background: #253239; border: 2.5px solid #fff;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 1px #253239, 0 4px 10px rgba(37,50,57,0.25); }
        .ba-mkr--warn { background: #bb3030;
          box-shadow: 0 0 0 1px #bb3030, 0 4px 10px rgba(187,48,48,0.25); }
        .ba-mkr--ok   { background: #0c6826;
          box-shadow: 0 0 0 1px #0c6826, 0 4px 10px rgba(12,104,38,0.25); }
        .ba-scale-labels { display: flex; justify-content: space-between; margin-top: 10px;
          font-family: ${fontM}; font-size: 10px; color: #7f949b;
          letter-spacing: 0.04em; text-transform: uppercase; }
        .ba-scale-labels em { font-style: normal; color: #253239; }

        /* ── Metric body (text + image) ── */
        .ba-metric-body { display: grid; grid-template-columns: 1fr; gap: 28px; align-items: start; }
        @media (min-width: 860px) {
          .ba-metric-body { grid-template-columns: minmax(0,1.1fr) minmax(0,1fr); gap: 56px; }
          .ba-metric-body--rev .ba-metric-text  { order: 2; }
          .ba-metric-body--rev .ba-metric-media { order: 1; }
        }
        .ba-metric-text { font-size: 15px; line-height: 1.65; color: #515255; }
        .ba-metric-text p { margin: 0 0 14px; }
        .ba-metric-text p:last-child { margin-bottom: 0; }
        .ba-metric-text cite { font-style: normal; color: #253239; }

        /* ── Scan image ── */
        .ba-scan { position: relative; aspect-ratio: 3/4; background: #1a1410;
          border-radius: 10px; overflow: hidden;
          box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(37,50,57,0.08); }
        .ba-scan-img { position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: top; }
        .ba-scan-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .ba-scan-tag { position: absolute; font-family: ${fontM}; font-size: 12px; font-weight: 600;
          letter-spacing: 0.04em; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          background: rgba(0,0,0,0.15); padding: 3px 7px;
          border: 1px solid rgba(255,255,255,0.4); border-radius: 3px;
          white-space: nowrap; transform: translate(-50%, -50%); }
        .ba-tag--green  { color: #8ee6a6; border-color: rgba(142,230,166,0.6); text-shadow: 0 1px 3px rgba(0,30,0,0.7); }
        .ba-tag--pink   { color: #ffb1c7; border-color: rgba(255,177,199,0.6); }
        .ba-tag--yellow { color: #ffe28c; border-color: rgba(255,226,140,0.6); }
        .ba-tag--blue   { color: #b8d6ff; border-color: rgba(184,214,255,0.6); }
        .ba-scan-caption { display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-top: 10px; font-family: ${fontM};
          font-size: 11px; letter-spacing: 0.04em; color: #7f949b; text-transform: uppercase; }

        /* ── Annex shared ── */
        .ba-annex-lede { font-size: 16px; line-height: 1.6; color: #515255; max-width: 660px; margin: 0 0 32px; }

        /* ── Height panel ── */
        .ba-height-panel { display: grid; grid-template-columns: 1fr; gap: 32px;
          padding: 32px 0; border-top: 1px solid #edf0f1; border-bottom: 1px solid #edf0f1; margin-bottom: 48px; }
        @media (min-width: 860px) { .ba-height-panel { grid-template-columns: 280px 1fr; gap: 64px; padding: 48px 0; align-items: start; } }
        .ba-height-num { font-family: ${fontD}; font-size: clamp(72px, 10vw, 112px);
          line-height: 0.9; letter-spacing: -0.04em; color: #253239; }
        .ba-height-num .ba-unit { font-family: ${fontM}; font-size: 18px; color: #7f949b;
          letter-spacing: 0.02em; margin-left: 6px; font-weight: 400; }
        .ba-height-tag { margin-top: 10px; font-family: ${fontS}; font-size: 11px;
          font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #7f949b; }
        .ba-height-h { font-family: ${fontS}; font-weight: 500; font-size: 18px;
          margin: 0 0 10px; color: #253239; }
        .ba-height-p { font-size: 15px; line-height: 1.6; color: #515255; margin: 0 0 16px; }
        .ba-inset-card { background: #f9fbfb; border: 1px solid #edf0f1;
          border-radius: 10px; padding: 18px 20px; margin-top: 20px; }
        .ba-inset-card-eye { font-family: ${fontS}; font-size: 10px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase; color: #253239; margin: 0 0 8px; }
        .ba-inset-card p { margin: 0; font-size: 14px; line-height: 1.55; color: #515255; }

        /* ── Facial split card ── */
        .ba-split-card { display: grid; grid-template-columns: 1fr;
          border: 1px solid #edf0f1; border-radius: 12px; overflow: hidden; background: #fff; }
        @media (min-width: 700px) { .ba-split-card { grid-template-columns: 1fr 1.2fr; } }
        .ba-split-col { padding: 24px 22px; }
        .ba-split-col + .ba-split-col { border-top: 1px solid #edf0f1; }
        @media (min-width: 700px) { .ba-split-col + .ba-split-col { border-top: 0; border-left: 1px solid #edf0f1; } }
        .ba-split-col--fixed { background: #f9fbfb; }
        .ba-split-eye { font-family: ${fontS}; font-size: 10px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase; color: #7f949b; margin: 0 0 14px; }
        .ba-split-list { list-style: none; padding: 0; margin: 0;
          font-size: 14px; line-height: 1.6; color: #515255; }
        .ba-split-list li { padding-left: 18px; position: relative; margin-bottom: 6px; }
        .ba-split-list li::before { content: "—"; position: absolute; left: 0; top: 0; color: #7f949b; }
        .ba-split-item { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px dashed #dfe4e6; }
        .ba-split-item:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
        .ba-split-item h5 { font-family: ${fontS}; font-weight: 500; font-size: 15px;
          color: #253239; margin: 0 0 6px; display: flex; align-items: baseline; gap: 6px; }
        .ba-split-item h5::before { content: "→"; color: #9eb1b8; font-weight: 400; }
        .ba-split-item p { margin: 0; font-size: 13.5px; line-height: 1.55; color: #515255; }

        /* ── Behavioral cols ── */
        .ba-annex-cols { display: grid; gap: 0; grid-template-columns: 1fr; border-top: 1px solid #edf0f1; }
        @media (min-width: 860px) {
          .ba-annex-cols { grid-template-columns: 1fr 1fr; }
          .ba-annex-cols > * { border-right: 1px solid #edf0f1; }
          .ba-annex-cols > *:nth-child(2n) { border-right: 0; }
        }
        .ba-annex-cell { padding: 22px 0; border-bottom: 1px solid #edf0f1; }
        @media (min-width: 860px) {
          .ba-annex-cell { padding: 24px 28px; }
          .ba-annex-cell:nth-child(odd)  { padding-left: 0; }
          .ba-annex-cell:nth-child(even) { padding-right: 0; }
        }
        .ba-annex-cell h5 { font-family: ${fontS}; font-weight: 500; font-size: 16px;
          color: #253239; margin: 0 0 8px; display: flex; align-items: baseline; gap: 8px; }
        .ba-annex-cell-n { font-family: ${fontM}; font-size: 11px; color: #7f949b; letter-spacing: 0.08em; }
        .ba-annex-cell p { font-size: 14px; line-height: 1.6; color: #515255; margin: 0; }

        /* ── Lifestyle prose stack ── */
        .ba-prose-stack { display: flex; flex-direction: column; gap: 0;
          border: 1px solid #edf0f1; border-radius: 12px; background: #fff; overflow: hidden; }
        .ba-prose-row { padding: 22px; border-bottom: 1px solid #edf0f1;
          display: grid; grid-template-columns: 1fr; gap: 4px 28px; }
        @media (min-width: 700px) { .ba-prose-row { grid-template-columns: 200px 1fr; padding: 26px 28px; gap: 8px 40px; } }
        .ba-prose-row:last-child { border-bottom: 0; }
        .ba-prose-row h5 { font-family: ${fontS}; font-weight: 500; font-size: 15px; color: #253239; margin: 0; }
        .ba-prose-row p  { font-size: 14px; line-height: 1.6; color: #515255; margin: 0; }
        .ba-prose-mono { font-family: ${fontM}; font-size: 11px; color: #7f949b;
          letter-spacing: 0.06em; text-transform: uppercase; margin-top: 4px; }

        /* ── Footer ── */
        .ba-foot { margin-top: 80px; padding: 44px 0; border-top: 1px solid #edf0f1;
          display: grid; gap: 28px; grid-template-columns: 1fr; align-items: start; }
        @media (min-width: 700px) { .ba-foot { grid-template-columns: 1fr auto; } }
        .ba-foot h4 { font-family: ${fontD}; font-weight: 400; font-size: 22px;
          margin: 0 0 6px; letter-spacing: -0.01em; color: #253239; }
        .ba-foot p  { font-size: 14px; color: #515255; margin: 0; line-height: 1.55; max-width: 520px; }
        .ba-foot-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .ba-btn { display: inline-flex; align-items: center; gap: 8px;
          font-family: ${fontS}; font-size: 14px; font-weight: 500;
          padding: 12px 24px; border-radius: 5px; cursor: pointer; text-decoration: none; }
        .ba-btn--primary { background: #253239; color: #fff; border: 1px solid #253239; }
        .ba-btn--primary:hover { background: #1a262d; border-color: #1a262d; }
        .ba-btn--ghost { background: transparent; color: #253239; border: 1px solid #dfe4e6; }
        .ba-btn--ghost:hover { background: #f9fbfb; border-color: #253239; }
        .ba-micro-foot { padding: 20px 0 40px; display: flex; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; font-family: ${fontM}; font-size: 10px;
          color: #7f949b; letter-spacing: 0.06em; text-transform: uppercase;
          border-top: 1px solid #edf0f1; }
        .ba-micro-foot em { font-style: normal; color: #253239; }

        @media (max-width: 600px) {
          .ba-metric-right { flex-direction: column; align-items: flex-end; gap: 6px; }
          .ba-minirow { grid-template-columns: 36px 1fr; }
          .ba-minirow-val { grid-column: 1 / -1; justify-content: flex-start; }
        }
      `}</style>

      {/* ── Mobile chip nav ── */}
      <nav className="ba-chips">
        <a href="#ba-swr" className="ba-chip">01 · SWR</a>
        <a href="#ba-cwr" className="ba-chip">02 · CWR</a>
        <a href="#ba-bf"  className="ba-chip">03 · BF%</a>
        <a href="#ba-ti"  className="ba-chip">04 · TI</a>
        <a href="#ba-pas" className="ba-chip">05 · PAS</a>
        <a href="#ba-pc"  className="ba-chip">06 · PC</a>
        {heightCm && <a href="#ba-height" className="ba-chip">Height</a>}
        <a href="#ba-facial"     className="ba-chip">Facial</a>
        <a href="#ba-behavioral" className="ba-chip">Behavioral</a>
        <a href="#ba-lifestyle"  className="ba-chip">Lifestyle</a>
      </nav>

      <div className="ba-container">

        {/* ── Report header ── */}
        <header className="ba-report-head">
          <p className="ba-eyebrow">Protocol · Clinical Report</p>
          <h1 className="ba-h1">Body <em>Analysis</em></h1>
          <p className="ba-sub">
            A structural assessment of over 100 attractiveness variables measured from your intake scan. Each metric is cited, ranged, and ranked by leverage — so the protocol you receive is calibrated to what will actually move.
          </p>
          <dl className="ba-meta">
            <div><dt>Subject</dt><dd>{firstName}{age ? ` · M · ${age}` : ""}</dd></div>
            <div><dt>Scan ID</dt><dd>{scanId}</dd></div>
            <div><dt>Analyst</dt><dd>Protocol AI</dd></div>
            <div><dt>Method</dt><dd>PRTCL–v4.2</dd></div>
          </dl>
        </header>

        {/* ── Composite score ── */}
        <section className="ba-composite">
          <div>
            <p className="ba-composite-label">Composite Attractiveness Index</p>
            <div className="ba-composite-score">
              <span className="ba-big">{score}</span>
              <span className="ba-denom">/100</span>
              {delta > 0 && <span className="ba-delta">+{delta} Projected · 12 wk</span>}
            </div>
            <p className="ba-composite-desc" style={{ marginTop: 18 }}>
              {priorityCount > 0
                ? <><strong>{priorityCount} structural lever{priorityCount > 1 ? "s" : ""}</strong> within protocol range. Posture and proportion coherence hold the largest share of short-term gain.</>
                : <>All structural metrics are within optimal range. Focus on maintaining and refining.</>
              }
            </p>
          </div>
          <div className="ba-minigrid">
            {miniMetrics.map(({ code, label, val, f }) => (
              <div key={code} className="ba-minirow">
                <span className="ba-minirow-code">{code}</span>
                <span className="ba-minirow-label">{label}</span>
                <span className="ba-minirow-val">
                  {val}
                  <span className={`ba-prio ${PRIO_CLS[f]}`}>{PRIO_TEXT[f]}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section: Detailed Analysis ── */}
        <div className="ba-section-top" id="ba-detailed">
          <h2>Detailed Analysis · Structural</h2>
          <span className="ba-count">06 metrics</span>
        </div>

        {/* ── 01 · SWR ── */}
        <article className="ba-metric" id="ba-swr">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">SWR · 01</span>
              <h3 className="ba-metric-name">Shoulder-to-Waist Ratio</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.swr.toFixed(2)}</span>
              <span className={`ba-flag ${FLAG_CLS[swrF]}`}>{FLAG_LABEL[swrF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.swr} scaleMin={1.00} scaleMax={1.90}
            optMin={ranges.swr[0]} optMax={ranges.swr[1]} f={swrF}
            labels={["1.00", "1.20", "1.40", `Optimal ${ranges.swr[0]}–${ranges.swr[1]}`, "1.80"]} />
          <div className="ba-metric-body">
            <div className="ba-metric-text">
              <p>Cross-cultural studies <cite>(Maisey 1999; Sell 2017)</cite> identify the shoulder-to-waist ratio as the single strongest predictor of male attractiveness — ranking above facial features, height, or raw muscularity.</p>
              <p>Relative shoulder breadth is partly determined by testosterone during puberty, making it a biological marker of genetic health. The optimal zone {ranges.swr[0]}–{ranges.swr[1]} corresponds to the classic V-shape: pronounced enough to create a distinct silhouette, without reaching the extreme proportions of competitive athletes.</p>
            </div>
            {photoFront && points && (() => {
              const { shoulderLeft: sl, shoulderRight: sr } = points;
              const sy = (sl.y + sr.y) / 2;
              return (
                <ScanPhoto src={photoFront} alt="Front body scan — shoulder-to-waist measurement" caption="Shoulder-to-waist measurement">
                  <svg className="ba-scan-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1={sl.x} y1={sy} x2={sr.x} y2={sy} stroke={OC.shoulder.line} strokeWidth="0.5"/>
                    <line x1={sl.x} y1={sy-3} x2={sl.x} y2={sy+3} stroke={OC.shoulder.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <line x1={sr.x} y1={sy-3} x2={sr.x} y2={sy+3} stroke={OC.shoulder.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <text x={sr.x+2} y={sy-1.5} textAnchor="start" fontSize="2.2" fill={OC.shoulder.line} fontWeight="600" letterSpacing="0.15">
                      SWR {metrics.swr.toFixed(2)}
                    </text>
                  </svg>
                </ScanPhoto>
              );
            })()}
            {photoFront && !points && (
              <ScanPhoto src={photoFront} alt="Front body scan — shoulder-to-waist measurement" caption="Shoulder-to-waist measurement" />
            )}
          </div>
        </article>

        {/* ── 02 · CWR ── */}
        <article className="ba-metric" id="ba-cwr">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">CWR · 02</span>
              <h3 className="ba-metric-name">Chest-to-Waist Ratio</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.cwr.toFixed(2)}</span>
              <span className={`ba-flag ${FLAG_CLS[cwrF]}`}>{FLAG_LABEL[cwrF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.cwr} scaleMin={0.90} scaleMax={1.45}
            optMin={ranges.cwr[0]} optMax={ranges.cwr[1]} f={cwrF}
            labels={["0.90", "1.00", "1.15", `Optimal ${ranges.cwr[0]}–${ranges.cwr[1]}`, "1.40"]} />
          <div className="ba-metric-body ba-metric-body--rev">
            <div className="ba-metric-text">
              <p>Chest prominence relative to the waist is a consistent secondary attractiveness signal <cite>(Stulp 2015)</cite>. A developed torso indicates respiratory capacity and upper-body functional strength — attributes valued in social competition contexts.</p>
              <p>A CWR within the target zone ({ranges.cwr[0]}–{ranges.cwr[1]}) creates front-facing visual depth that amplifies the perceived SWR and gives presence to the silhouette.</p>
            </div>
            {photoFront && points && (() => {
              const { chestLeft: cl, chestRight: cr, waistLeft: wl, waistRight: wr } = points;
              const cy2 = (cl.y + cr.y) / 2;
              const wy  = (wl.y + wr.y) / 2;
              return (
                <ScanPhoto src={photoFront} alt="Chest measurement scan" caption="Chest-to-waist measurement">
                  <svg className="ba-scan-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1={cl.x} y1={cy2} x2={cr.x} y2={cy2} stroke={OC.chest.line} strokeWidth="0.5"/>
                    <line x1={cl.x} y1={cy2-3} x2={cl.x} y2={cy2+3} stroke={OC.chest.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <line x1={cr.x} y1={cy2-3} x2={cr.x} y2={cy2+3} stroke={OC.chest.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <line x1={wl.x} y1={wy} x2={wr.x} y2={wy} stroke={OC.chest.faint} strokeWidth="0.3" strokeDasharray="1 1"/>
                    <text x={cr.x+2} y={cy2-1.5} textAnchor="start" fontSize="2.2" fill={OC.chest.line} fontWeight="600" letterSpacing="0.15">
                      CWR {metrics.cwr.toFixed(2)}
                    </text>
                  </svg>
                </ScanPhoto>
              );
            })()}
            {photoFront && !points && (
              <ScanPhoto src={photoFront} alt="Chest measurement scan" caption="Chest-to-waist measurement" />
            )}
          </div>
        </article>

        {/* ── 03 · BF% ── */}
        <article className="ba-metric" id="ba-bf">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">BF% · 03</span>
              <h3 className="ba-metric-name">Body Fat Percentage</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.bf}<span className="ba-unit">%</span></span>
              <span className={`ba-flag ${FLAG_CLS[bfF]}`}>{FLAG_LABEL[bfF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.bf} scaleMin={6} scaleMax={34}
            optMin={ranges.bf[0]} optMax={ranges.bf[1]} f={bfF}
            labels={["6%", `Opt. ${ranges.bf[0]}–${ranges.bf[1]}%`, "22%", "28%", "34%"]} />
          <div className="ba-metric-body">
            <div className="ba-metric-text" style={{ maxWidth: 640 }}>
              <p>Tovée (2000) and Crossley (2012) show that body-fat percentage significantly influences physical attractiveness independently of SWR. The <strong style={{ color: "#253239", fontWeight: 500 }}>{ranges.bf[0]}–{ranges.bf[1]}% zone</strong> is the sweet spot: visible muscle definition without the depleted look of competitors.</p>
              <p>Below {ranges.bf[0]}%, the physique can read as extreme; above {ranges.bf[1]}%, visceral fat reduces the visual readability of SWR and CWR by erasing the visual contrast between waist and chest.</p>
            </div>
          </div>
        </article>

        {/* ── 04 · TI ── */}
        <article className="ba-metric" id="ba-ti">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">TI · 04</span>
              <h3 className="ba-metric-name">Taper Index</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.ti.toFixed(2)}</span>
              <span className={`ba-flag ${FLAG_CLS[tiF]}`}>{FLAG_LABEL[tiF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.ti} scaleMin={0.20} scaleMax={2.00}
            optMin={ranges.ti[0]} optMax={ranges.ti[1]} f={tiF}
            labels={["0.20", "0.60", "1.00", `Optimal ${ranges.ti[0]}–${ranges.ti[1]}`, "2.00"]} />
          <div className="ba-metric-body ba-metric-body--rev">
            <div className="ba-metric-text">
              <p>The Taper Index measures the visual angle from shoulders down to the waist. Distinct from SWR, it captures the sharpness of the taper — one can have broad shoulders with wide hips and a low TI that undermines the perceived V-shape.</p>
              <p>Stulp (2013) shows this morphological axis is directly associated with judgments of physical dominance and protective strength — two salient attributes in male social competition dynamics.</p>
            </div>
            {photoFront && points && (() => {
              const { shoulderLeft: sl, shoulderRight: sr, waistLeft: wl, waistRight: wr } = points;
              const sy = (sl.y + sr.y) / 2;
              const wy = (wl.y + wr.y) / 2;
              return (
                <ScanPhoto src={photoFront} alt="Waist and hip taper measurement" caption="Waist & taper measurement">
                  <svg className="ba-scan-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1={sl.x} y1={sy} x2={wl.x} y2={wy} stroke={OC.waist.faint} strokeWidth="0.3" strokeDasharray="1.2 0.8"/>
                    <line x1={sr.x} y1={sy} x2={wr.x} y2={wy} stroke={OC.waist.faint} strokeWidth="0.3" strokeDasharray="1.2 0.8"/>
                    <line x1={wl.x} y1={wy} x2={wr.x} y2={wy} stroke={OC.waist.line} strokeWidth="0.5"/>
                    <line x1={wl.x} y1={wy-3} x2={wl.x} y2={wy+3} stroke={OC.waist.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <line x1={wr.x} y1={wy-3} x2={wr.x} y2={wy+3} stroke={OC.waist.line} strokeWidth="0.7" strokeLinecap="round"/>
                    <text x={wr.x+2} y={wy-1.5} textAnchor="start" fontSize="2.2" fill={OC.waist.line} fontWeight="600" letterSpacing="0.15">
                      TI {metrics.ti.toFixed(2)}
                    </text>
                  </svg>
                </ScanPhoto>
              );
            })()}
            {photoFront && !points && (
              <ScanPhoto src={photoFront} alt="Waist and hip taper measurement" caption="Waist & taper measurement" />
            )}
          </div>
        </article>

        {/* ── 05 · PAS ── */}
        <article className="ba-metric" id="ba-pas">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">PAS · 05</span>
              <h3 className="ba-metric-name">Posture Alignment Score</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.pas}<span className="ba-unit">/100</span></span>
              <span className={`ba-flag ${FLAG_CLS[pasF]}`}>{FLAG_LABEL[pasF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.pas} scaleMin={40} scaleMax={100}
            optMin={ranges.pas[0]} optMax={ranges.pas[1]} f={pasF}
            labels={["40", "55", "70", `Optimal ${ranges.pas[0]}–${ranges.pas[1]}`, "100"]} />
          <div className="ba-metric-body">
            <div className="ba-metric-text">
              <p>Upright posture is a universal signal of confidence and social dominance <cite>(Carney 2010)</cite>. Biomechanically, a forward head position or rounded shoulders visually reduce shoulder breadth — directly impacting perceived SWR.</p>
              <p>De la Rosa (2011) and Nettle (2002) show that perceived height, which correlates with male attractiveness (r&nbsp;=&nbsp;0.3–0.4), depends as much on postural alignment as on actual height.</p>
            </div>
            {photoSide && points && (() => {
              const { postureTop: pt, postureBottom: pb } = points;
              const midX = (pt.x + pb.x) / 2;
              const midY = (pt.y + pb.y) / 2;
              return (
                <ScanPhoto src={photoSide} alt="Side profile scan — spine alignment" caption="Postural alignment · Side view">
                  <svg className="ba-scan-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1={midX} y1={pt.y} x2={midX} y2={pb.y} stroke={OC.posture.faint} strokeWidth="0.3" strokeDasharray="2 2"/>
                    <line x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y} stroke={OC.posture.line} strokeWidth="0.5" strokeDasharray="2 1.5"/>
                    <circle cx={pt.x} cy={pt.y} r={1.2} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.4"/>
                    <circle cx={pb.x} cy={pb.y} r={1.2} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.4"/>
                    <text x={pt.x+2.5} y={pt.y+1} fontSize="2.2" fill={OC.posture.line} fontWeight="600" letterSpacing="0.1">EAR</text>
                    <text x={pb.x+2.5} y={pb.y-1} fontSize="2.2" fill={OC.posture.line} fontWeight="600" letterSpacing="0.1">ANKLE</text>
                    <text x={midX+2.5} y={midY+1} fontSize="2.2" fill={OC.posture.line} fontWeight="600" letterSpacing="0.15">
                      PAS {metrics.pas}
                    </text>
                  </svg>
                </ScanPhoto>
              );
            })()}
            {photoSide && !points && (
              <ScanPhoto src={photoSide} alt="Side profile scan — spine alignment" caption="Postural alignment · Side view" />
            )}
          </div>
        </article>

        {/* ── 06 · PC ── */}
        <article className="ba-metric" id="ba-pc">
          <header className="ba-metric-head">
            <div className="ba-metric-title">
              <span className="ba-metric-code">PC · 06</span>
              <h3 className="ba-metric-name">Proportion Coherence</h3>
            </div>
            <div className="ba-metric-right">
              <span className="ba-metric-value">{metrics.pc}<span className="ba-unit">/100</span></span>
              <span className={`ba-flag ${FLAG_CLS[pcF]}`}>{FLAG_LABEL[pcF]}</span>
            </div>
          </header>
          <ScaleBar value={metrics.pc} scaleMin={0} scaleMax={100}
            optMin={ranges.pc[0]} optMax={ranges.pc[1]} f={pcF}
            labels={["0", "25", `Optimal ${ranges.pc[0]}–${ranges.pc[1]}`, "85", "100"]} />
          <div className="ba-metric-body">
            <div className="ba-metric-text" style={{ maxWidth: 640 }}>
              <p>This composite score measures how well your individual metrics form a harmonious whole. Attractiveness research <cite>(Langlois 1994; Rhodes 2006)</cite> shows that proportional coherence is intrinsically perceived as attractive — the brain processes proportional harmony as a signal of good developmental health.</p>
              <p>A high PC means your overall silhouette reads correctly, even if no single metric reaches an extreme level. It&apos;s the difference between looking &ldquo;built&rdquo; and looking athletic.</p>
            </div>
          </div>
        </article>

        {/* ══ Annex · Height ══ */}
        {heightCm && (
          <>
            <div className="ba-section-top" id="ba-height">
              <h2>Annex · Height</h2>
              <span className="ba-count">A.01</span>
            </div>
            <div className="ba-height-panel">
              <div>
                <div className="ba-height-num">{heightCm}<span className="ba-unit">cm</span></div>
                <div className="ba-height-tag">
                  {heightCm >= 183 ? "Tall · above the range where height provides the strongest attractiveness gains" :
                   heightCm >= 175 ? "Average · in the core zone where structural levers dominate" :
                   "Below average · posture and SWR carry additional compensatory weight"}
                </div>
              </div>
              <div>
                <h4 className="ba-height-h">Height correlates consistently with male attractiveness across cultures <cite style={{ fontStyle: "normal", color: "#9eb1b8" }}>(Nettle 2002; Pawlowski 2000; Stulp 2013)</cite>.</h4>
                <p className="ba-height-p">The effect is real but non-linear: gains are strongest below ~183 cm and plateau above it. Taller men are perceived as higher-status, more dominant, and more attractive as long-term partners. Height is approximately 80% heritable and established in early adulthood — no training protocol changes your skeletal height.</p>
                <div className="ba-inset-card">
                  <p className="ba-inset-card-eye">What you control</p>
                  <p>Postural alignment (your PAS score) directly affects perceived height. Forward head posture and thoracic kyphosis can reduce apparent height by 2–5 cm. Every point gained on PAS is effectively a height gain in the perception of observers — without adding a centimeter to your skeleton.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ Annex · Facial ══ */}
        <div className="ba-section-top" id="ba-facial">
          <h2>Annex · Facial Analysis</h2>
          <span className="ba-count">A.02</span>
        </div>
        <p className="ba-annex-lede">
          Facial attractiveness operates on two layers: the structural substrate — largely fixed — and the presentation layer, which is substantially trainable. Research <cite style={{ fontStyle: "normal", color: "#253239" }}>(Langlois 1994; Rhodes 2006)</cite> shows both symmetry and averageness drive baseline facial attractiveness, but presentation variables can shift perceived attractiveness by a meaningful margin.
        </p>
        <div className="ba-split-card">
          <div className="ba-split-col ba-split-col--fixed">
            <p className="ba-split-eye">Fixed · Structural</p>
            <ul className="ba-split-list">
              <li>Bone structure &amp; jaw width</li>
              <li>Facial symmetry baseline</li>
              <li>Inter-ocular distance</li>
              <li>Brow ridge prominence</li>
            </ul>
          </div>
          <div className="ba-split-col">
            <p className="ba-split-eye">Improvable · Presentation</p>
            <div className="ba-split-item">
              <h5>BF% &amp; facial sharpness</h5>
              <p>A 3–5% reduction in body fat visibly sharpens the jaw, cheekbones, and orbital area. The face is one of the first places fat loss registers.</p>
            </div>
            <div className="ba-split-item">
              <h5>Facial hair</h5>
              <p>Heavy stubble (~10 days) rates highest for both attractiveness and perceived dominance <cite>(Neave &amp; Shields 2008)</cite>. Full beard signals maturity; clean shaven signals approachability.</p>
            </div>
            <div className="ba-split-item">
              <h5>Skincare</h5>
              <p>Skin texture evenness is processed as a health cue. A minimal routine — SPF, retinol, hydration — addresses the main visible markers.</p>
            </div>
            <div className="ba-split-item">
              <h5>Grooming</h5>
              <p>Hair styling, brow maintenance, and overall presentation constitute &ldquo;care signals&rdquo; — indicating investment in self-presentation, itself an attractiveness cue.</p>
            </div>
          </div>
        </div>

        {/* ══ Annex · Behavioral ══ */}
        <div className="ba-section-top" id="ba-behavioral">
          <h2>Annex · Behavioral Signals</h2>
          <span className="ba-count">A.03</span>
        </div>
        <p className="ba-annex-lede">
          Physical metrics capture the static attractiveness baseline. Dynamic signals — movement, gaze, voice, spatial behavior — are processed in real social contexts and can substantially amplify or undermine the impression created by your physique.
        </p>
        <div className="ba-annex-cols">
          {[
            { n: "01", title: "Gait & Movement", body: "Deliberate, unhurried movement is processed as a high-status signal within 180ms of observation (Grammer 1996). Rushed or jerky movement patterns correlate with anxiety and lower social status. Slowing down purposefully — walking at 80% of your normal pace — is one of the highest-leverage behavioral adjustments." },
            { n: "02", title: "Eye Contact",     body: "Sustained gaze (3–5 second holds before breaking) signals social confidence and dominance. Gaze aversion — looking down or away immediately — is universally interpreted as low status. The goal is not staring but comfortable, unhurried contact that communicates ease." },
            { n: "03", title: "Voice",            body: "Lower pitch and slower speech tempo are consistently associated with perceived dominance and attract women (Puts 2005). Resonance — chest voice vs. head voice — is the key variable, more than raw pitch. Deliberate pauses before answering also signal confidence." },
            { n: "04", title: "Spatial Behavior", body: "Expansive posture in social settings — wide stance, open body positioning, taking up space — estimates the same dominant display cues that make PAS valuable in photos. Contracting the body (crossed arms, hunched shoulders) signals low status regardless of physique." },
          ].map(({ n, title, body }) => (
            <div key={n} className="ba-annex-cell">
              <h5><span className="ba-annex-cell-n">{n}</span>{title}</h5>
              <p>{body}</p>
            </div>
          ))}
        </div>

        {/* ══ Annex · Lifestyle ══ */}
        <div className="ba-section-top" id="ba-lifestyle">
          <h2>Annex · Lifestyle &amp; Hormonal Health</h2>
          <span className="ba-count">A.04</span>
        </div>
        <p className="ba-annex-lede">
          The physical metrics in this protocol are downstream of hormonal and lifestyle variables. Training and nutrition move the numbers — but sleep, stress, and recovery determine the ceiling of what&apos;s achievable.
        </p>
        <div className="ba-prose-stack">
          <div className="ba-prose-row">
            <div>
              <h5>Sleep &amp; Testosterone</h5>
              <p className="ba-prose-mono">Priority · highest leverage</p>
            </div>
            <p>Sleeping fewer than 7 hours per night reduces testosterone levels by 10–15% (Leproult &amp; Van Cauter 2011). Since testosterone drives the shoulder-broadening and muscle-building adaptations your protocol targets, sleep is the highest-leverage recovery variable — more impactful than any supplement.</p>
          </div>
          <div className="ba-prose-row">
            <div>
              <h5>Stress &amp; Cortisol</h5>
              <p className="ba-prose-mono">Systemic · body-composition</p>
            </div>
            <p>Chronic stress elevates cortisol, which promotes preferential visceral fat storage around the abdomen — directly degrading your BF% score and reducing the visual contrast between waist and chest that SWR and CWR depend on. Stress management is not optional if body composition is a priority.</p>
          </div>
          <div className="ba-prose-row">
            <div>
              <h5>Hydration &amp; Presentation</h5>
              <p className="ba-prose-mono">Short-term · presentation</p>
            </div>
            <p>Subcutaneous water retention — driven by high sodium intake, alcohol, or chronic inflammation — blurs muscle definition by the equivalent of 1–2% BF. Day-to-day presentation can vary significantly based on these factors, independent of your actual body composition.</p>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="ba-foot">
          <div>
            <p style={{ fontFamily: fontS, fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097", margin: "0 0 8px" }}>Next</p>
            <h4>Your 12-week action plan is ready.</h4>
            <p>Protocol compiled from the priority levers in this report. Personalised training, nutrition, and recovery — aligned to your specific structural gaps.</p>
          </div>
          <div className="ba-foot-actions">
            <button
              className="ba-btn ba-btn--primary"
              onClick={() => window.dispatchEvent(new CustomEvent("protocol-navigate", { detail: "action-plan" }))}
            >
              Open Action Plan →
            </button>
          </div>
        </div>

        <div className="ba-micro-foot">
          <span>Report v4.2 · PRTCL Clinical</span>
          <span><em>Confidential</em> · for subject use only · © {new Date().getFullYear()} Protocol</span>
        </div>

      </div>
    </div>
  );
}

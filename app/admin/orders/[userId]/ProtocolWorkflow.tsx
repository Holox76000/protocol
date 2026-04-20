"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { CalibrationMetrics } from "./PhotoCalibrator";
import type { ProtocolQuestionnaire } from "./types";

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63], cwr: [1.25, 1.35], bf: [10, 17],
  pas: [80, 95],     ti:  [1.1, 1.5],   pc: [75, 95],
};

const METRIC_DEFS: { key: keyof CalibrationMetrics; label: string; abbr: string; fmt: (v: number) => string }[] = [
  { key: "swr", abbr: "SWR", label: "Shoulder-Waist Ratio", fmt: (v) => String(v) },
  { key: "cwr", abbr: "CWR", label: "Chest-Waist Ratio",    fmt: (v) => String(v) },
  { key: "bf",  abbr: "BF%", label: "Body Fat",             fmt: (v) => `${v}%`   },
  { key: "pas", abbr: "PAS", label: "Posture Score",         fmt: (v) => `${v}`    },
  { key: "ti",  abbr: "TI",  label: "Taper Index",           fmt: (v) => String(v) },
  { key: "pc",  abbr: "PC",  label: "Proportion",            fmt: (v) => `${v}`    },
];

function metricStatus(key: keyof CalibrationMetrics, value: number): "good" | "warn" | "bad" {
  const [min, max] = RANGES[key];
  if (key === "bf") {
    if (value >= min && value <= max) return "good";
    return value <= 22 ? "warn" : "bad";
  }
  if (value >= min && value <= max) return "good";
  return Math.min(Math.abs(value - min), Math.abs(value - max)) < (max - min) * 0.8 ? "warn" : "bad";
}

type Props = {
  userId:                  string;
  initialStatus:           string;
  initialMetrics:          CalibrationMetrics | null;
  beforeAfterPreviewPath?: string | null;
};

export default function ProtocolWorkflow({ userId, initialStatus, initialMetrics, beforeAfterPreviewPath }: Props) {
  const [step,    setStep]    = useState<"calibrate" | "before-after">(initialMetrics ? "before-after" : "calibrate");
  const [metrics] = useState<CalibrationMetrics | null>(initialMetrics);
  const [status,          setStatus]          = useState(initialStatus);
  const [delivering,      setDelivering]      = useState(false);
  const [confirmDeliver,  setConfirmDeliver]  = useState(false);
  const [deliverError,    setDeliverError]    = useState<string | null>(null);

  const isDelivered = status === "delivered";

  const handleDeliver = async () => {
    if (!confirmDeliver) {
      setConfirmDeliver(true);
      setTimeout(() => setConfirmDeliver(false), 4000);
      return;
    }
    setDelivering(true);
    setDeliverError(null);
    try {
      const res = await fetch(`/api/admin/orders/${userId}/deliver`, { method: "POST" });
      const d = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) setDeliverError(d.error ?? "Delivery failed.");
      else { setStatus("delivered"); setConfirmDeliver(false); }
    } catch { setDeliverError("Network error."); }
    finally { setDelivering(false); }
  };

  const calibrated = metrics !== null;

  return (
    <div className="space-y-4">
      {/* Step tabs */}
      <div className="flex gap-1 rounded-xl border border-wire bg-ash p-1">
        {([
          { id: "calibrate"    as const, label: "1 · Calibration" },
          { id: "before-after" as const, label: "2 · Before/After" },
        ]).map(({ id, label }) => {
          const isActive   = step === id;
          const isDisabled = id === "before-after" && !calibrated;
          return (
            <button
              key={id}
              onClick={() => { if (!isDisabled) setStep(id); }}
              disabled={isDisabled}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                isActive
                  ? "bg-white text-void shadow-sm"
                  : isDisabled
                  ? "cursor-not-allowed text-mute/40"
                  : "text-mute hover:text-void"
              }`}
            >
              {id === "calibrate" && calibrated ? "✓ " : ""}{label}
            </button>
          );
        })}
      </div>

      {/* Calibration step */}
      {step === "calibrate" && (
        <div className="space-y-3">
          {calibrated && metrics ? (
            /* Calibration done — show metrics summary */
            <>
              <div className="grid grid-cols-3 gap-2">
                {METRIC_DEFS.map(({ key, abbr, label, fmt }) => {
                  const value  = metrics[key];
                  const status = metricStatus(key, value);
                  return (
                    <div key={key} className="rounded-lg border border-wire bg-ash px-2.5 py-2 text-center">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mute">{abbr}</p>
                      <p className={`mt-0.5 text-[14px] font-semibold tabular-nums leading-none ${
                        status === "good" ? "text-emerald-600" : status === "warn" ? "text-amber-600" : "text-red-600"
                      }`}>
                        {fmt(value)}
                      </p>
                      <p className="mt-0.5 text-[8px] leading-tight text-mute/60">{label}</p>
                    </div>
                  );
                })}
              </div>
              <Link
                href={`/admin/orders/${userId}/calibrate`}
                className="flex w-full items-center justify-center rounded-lg border border-wire bg-white px-4 py-2.5 text-[12px] font-semibold text-void transition-colors hover:bg-ash"
              >
                Edit calibration →
              </Link>
              <button
                onClick={() => setStep("before-after")}
                className="flex w-full items-center justify-center rounded-lg bg-void px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b]"
              >
                Before/After →
              </button>
            </>
          ) : (
            /* Not yet calibrated */
            <div className="flex flex-col items-center gap-4 rounded-xl border border-wire bg-ash px-6 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-void/10">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 10h14M10 3v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M5 6h10M5 14h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".4"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-void">Calibrate the photos</p>
                <p className="mt-1 text-[11px] text-mute">
                  Place the measurement bands to compute SWR, CWR, BF%, PAS, TI, PC.
                </p>
              </div>
              <Link
                href={`/admin/orders/${userId}/calibrate`}
                className="flex w-full items-center justify-center rounded-lg bg-void px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b]"
              >
                Open calibration →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Before/After step */}
      {step === "before-after" && (
        <BeforeAfterGenerator
          userId={userId}
          hasExistingPreview={!!beforeAfterPreviewPath}
        />
      )}

      {/* Deliver */}
      <div className="border-t border-wire pt-4 space-y-2">
        {isDelivered && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
              Delivered
            </span>
          </div>
        )}
        {deliverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{deliverError}</p>
        )}
        <button
          onClick={handleDeliver}
          disabled={delivering}
          className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[12px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            confirmDeliver
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-void text-white hover:bg-[#1a1a1b]"
          }`}
        >
          {delivering
            ? "Delivering…"
            : confirmDeliver
            ? "Confirm — this will notify the client"
            : isDelivered
            ? "Re-deliver"
            : "Mark as delivered"}
        </button>
      </div>
    </div>
  );
}

// ── Before/After generator ──────────────────────────────────────────────────

function BeforeAfterGenerator({
  userId,
  hasExistingPreview,
}: {
  userId:            string;
  hasExistingPreview: boolean;
}) {
  const [beforeUrl,  setBeforeUrl]  = useState<string | null>(null);
  const [afterUrl,   setAfterUrl]   = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!hasExistingPreview) return;
    const res = await fetch(`/api/admin/generate-before-after?userId=${userId}`);
    if (res.ok) {
      const data = await res.json() as { beforeUrl: string | null; afterUrl: string | null };
      setBeforeUrl(data.beforeUrl);
      setAfterUrl(data.afterUrl);
    }
  }, [hasExistingPreview, userId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/generate-before-after", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId }),
      });
      const data = await res.json() as { beforeUrl?: string; afterUrl?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Generation failed.");
      } else {
        setBeforeUrl(data.beforeUrl ?? null);
        setAfterUrl(data.afterUrl   ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setGenerating(false);
    }
  };

  // Result view
  if (afterUrl) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-mute">Before</p>
            <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeUrl ?? ""} alt="Before" className="absolute inset-0 h-full w-full object-cover object-top" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-600">After · AI</p>
            <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={afterUrl} alt="After" className="absolute inset-0 h-full w-full object-cover object-top" />
            </div>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-wire py-2 text-[11px] font-semibold text-dim transition-colors hover:text-void disabled:opacity-40"
        >
          {generating ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
              Generating…
            </>
          ) : "↻ Regenerate"}
        </button>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
    );
  }

  // Generate CTA
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-wire bg-ash px-5 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-void/10 text-[18px]">
        ◑
      </div>
      <div>
        <p className="text-[13px] font-semibold text-void">Generate Before/After</p>
        <p className="mt-1 text-[11px] leading-relaxed text-mute">
          Uses calibration metrics + age to project the realistic target physique via Gemini.
        </p>
      </div>
      <button
        onClick={generate}
        disabled={generating}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-void px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b] disabled:opacity-40"
      >
        {generating ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating — ~15s…
          </>
        ) : "Generate →"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

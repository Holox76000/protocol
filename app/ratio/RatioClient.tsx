"use client";

import { useRef, useState, useCallback } from "react";
import type { PoseLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

type Metrics = {
  shoulderHipRatio: number;
  legTorsoRatio: number;
  shoulderWidthPct: number;
  hipWidthPct: number;
};

type Status = "idle" | "loading-model" | "analyzing" | "done" | "error";

// Lazy-load MediaPipe so it doesn't bloat SSR
let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
      );
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

function extractMetrics(landmarks: NormalizedLandmark[]): Metrics | null {
  if (!landmarks || landmarks.length < 29) return null;

  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const hipWidth = Math.abs(rHip.x - lHip.x);
  const torsoHeight = Math.abs(((lHip.y + rHip.y) / 2) - ((lShoulder.y + rShoulder.y) / 2));
  const legLength = Math.abs(((lAnkle.y + rAnkle.y) / 2) - ((lHip.y + rHip.y) / 2));

  if (hipWidth < 0.01 || torsoHeight < 0.01) return null;

  return {
    shoulderHipRatio: shoulderWidth / hipWidth,
    legTorsoRatio: legLength / torsoHeight,
    shoulderWidthPct: Math.round(shoulderWidth * 100),
    hipWidthPct: Math.round(hipWidth * 100),
  };
}

function getRatioLabel(ratio: number): { label: string; color: string } {
  if (ratio >= 1.45) return { label: "Elite V-taper", color: "#16a34a" };
  if (ratio >= 1.35) return { label: "Strong V-taper", color: "#22c55e" };
  if (ratio >= 1.2) return { label: "Good proportions", color: "#84cc16" };
  if (ratio >= 1.05) return { label: "Average", color: "#f59e0b" };
  return { label: "Needs work", color: "#ef4444" };
}

export default function RatioClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analyze = useCallback(async (file: File) => {
    setStatus("loading-model");
    setMetrics(null);
    setErrorMsg("");

    try {
      const landmarker = await getPoseLandmarker();
      setStatus("analyzing");

      // createImageBitmap auto-corrects EXIF rotation (handles sideways iPhone photos)
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();

      const objectUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPreview(objectUrl);

      const img = new window.Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });

      const result = landmarker.detect(img);

      if (!result.landmarks || result.landmarks.length === 0) {
        setStatus("error");
        setErrorMsg("No person detected. Try a full-body photo with a clear background.");
        return;
      }

      const m = extractMetrics(result.landmarks[0]);
      if (!m) {
        setStatus("error");
        setErrorMsg("Could not compute ratios. Make sure the full body is visible.");
        return;
      }

      // Draw skeleton on canvas
      drawSkeleton(img, result.landmarks[0]);

      setMetrics(m);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Analysis failed. Please try another photo.");
    }
  }, []);

  function drawSkeleton(img: HTMLImageElement, landmarks: NormalizedLandmark[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const W = img.naturalWidth;
    const H = img.naturalHeight;

    // Connections to draw
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
      [25, 27], [26, 28],
    ];

    ctx.strokeStyle = "rgba(37,50,57,0.85)";
    ctx.lineWidth = Math.max(2, W * 0.004);

    for (const [a, b] of connections) {
      const p1 = landmarks[a];
      const p2 = landmarks[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x * W, p1.y * H);
      ctx.lineTo(p2.x * W, p2.y * H);
      ctx.stroke();
    }

    // Key points
    const keyPoints = [11, 12, 23, 24, 27, 28];
    for (const idx of keyPoints) {
      const p = landmarks[idx];
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, Math.max(4, W * 0.008), 0, 2 * Math.PI);
      ctx.fillStyle = "#253239";
      ctx.fill();
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) analyze(file);
  }

  const ratioInfo = metrics ? getRatioLabel(metrics.shoulderHipRatio) : null;

  return (
    <main className="min-h-screen bg-[#f9fbfb] flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-[560px]">

        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#7f949b] mb-6">
          Protocol Club
        </p>
        <h1 className="text-[32px] font-normal leading-tight text-[#253239] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Body ratio analyzer
        </h1>
        <p className="text-[15px] text-[#515255] leading-relaxed mb-10">
          Upload a full-body photo. MediaPipe detects your pose and computes key proportions instantly — no data leaves your device.
        </p>

        {/* Upload zone */}
        {status === "idle" || status === "error" ? (
          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center w-full border-2 border-dashed border-[#dfe4e6] rounded-2xl p-12 cursor-pointer hover:border-[#253239] transition-colors bg-white"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-4 text-[#7f949b]">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[14px] font-semibold text-[#253239] mb-1">Drop a photo here</p>
            <p className="text-[13px] text-[#7f949b]">or click to select — JPG, PNG, WEBP</p>
            {status === "error" && (
              <p className="mt-4 text-[13px] text-red-500 text-center">{errorMsg}</p>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        ) : null}

        {/* Loading states */}
        {(status === "loading-model" || status === "analyzing") && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-[#253239] border-t-transparent animate-spin" />
            <p className="text-[14px] text-[#515255]">
              {status === "loading-model" ? "Loading model…" : "Analyzing pose…"}
            </p>
          </div>
        )}

        {/* Results */}
        {status === "done" && metrics && ratioInfo && (
          <div className="flex flex-col gap-6">

            {/* Canvas with skeleton */}
            <div className="rounded-2xl overflow-hidden border border-[#edf0f1] bg-white">
              <canvas ref={canvasRef} className="w-full h-auto block" />
            </div>

            {/* Main ratio card */}
            <div className="bg-white rounded-2xl border border-[#edf0f1] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7f949b] mb-4">
                Shoulder / Hip ratio
              </p>
              <div className="flex items-end justify-between mb-4">
                <span className="text-[48px] font-light text-[#253239] leading-none">
                  {metrics.shoulderHipRatio.toFixed(2)}
                </span>
                <span
                  className="text-[13px] font-semibold px-3 py-1 rounded-full"
                  style={{ color: ratioInfo.color, background: ratioInfo.color + "18" }}
                >
                  {ratioInfo.label}
                </span>
              </div>
              {/* Bar */}
              <div className="h-1.5 rounded-full bg-[#edf0f1] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, ((metrics.shoulderHipRatio - 0.9) / 0.7) * 100)}%`,
                    background: ratioInfo.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-[#7f949b]">0.90</span>
                <span className="text-[11px] text-[#7f949b]">1.60+</span>
              </div>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-[#edf0f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] mb-2">Leg / Torso ratio</p>
                <p className="text-[28px] font-light text-[#253239]">{metrics.legTorsoRatio.toFixed(2)}</p>
                <p className="text-[12px] text-[#7f949b] mt-1">
                  {metrics.legTorsoRatio >= 1.4 ? "Long legs" : metrics.legTorsoRatio >= 1.1 ? "Balanced" : "Short legs"}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-[#edf0f1] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f949b] mb-2">Shoulder width</p>
                <p className="text-[28px] font-light text-[#253239]">{metrics.shoulderWidthPct}%</p>
                <p className="text-[12px] text-[#7f949b] mt-1">of frame width</p>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[12px] text-[#7f949b] leading-relaxed">
              Ratios are computed from 2D pose landmarks and are relative — not absolute measurements. Accuracy depends on photo angle and distance. Best results with a straight-on full-body photo.
            </p>

            {/* Try another */}
            <label className="cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-[#dfe4e6] py-3 text-[13px] font-semibold text-[#515255] hover:border-[#253239] hover:text-[#253239] transition-colors bg-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Try another photo
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}

        {/* Hidden canvas for drawing (used during analysis) */}
        {status !== "done" && <canvas ref={canvasRef} className="hidden" />}
      </div>
    </main>
  );
}

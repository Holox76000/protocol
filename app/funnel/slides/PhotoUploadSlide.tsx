"use client";

import { useRef, useState } from "react";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";
import { trackFunnelPhotoUploaded } from "../../../lib/funnel-analytics";

type PhotoType = "body" | "face" | "profile";

type Props = {
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  photoType?: PhotoType;
};

const PHOTO_CONFIG: Record<PhotoType, { answerKey: string; title: string; sub: string; hint: string }> = {
  body: {
    answerKey: "_photo_path",
    title: "See yourself transformed.",
    sub: "Upload a full-body or upper-body photo and we'll generate a personalized preview of what you could look like after your 12-week Protocol.",
    hint: "Full-body or upper-body · JPEG or PNG",
  },
  face: {
    answerKey: "face_photo_path",
    title: "Add a face photo.",
    sub: "Optional — helps us calibrate your projection preview more precisely. A clear, well-lit face photo works best.",
    hint: "Front-facing, natural light · JPEG or PNG",
  },
  profile: {
    answerKey: "profile_photo_path",
    title: "Add a side profile.",
    sub: "Optional — a side-view photo lets us assess posture and silhouette for a more complete projection preview.",
    hint: "Side view, full height · JPEG or PNG",
  },
};

type Status = "idle" | "uploading" | "generating" | "done" | "error";

export function PhotoUploadSlide({ answers, onAnswer, onNext, onBack, photoType = "body" }: Props) {
  const cfg = PHOTO_CONFIG[photoType];
  const [status, setStatus] = useState<Status>(() =>
    answers[cfg.answerKey] ? "done" : "idle"
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = answers._session_id as string | undefined;

  async function handleFile(file: File) {
    if (!sessionId) return;
    setStatus("uploading");
    setPreview(URL.createObjectURL(file));
    setErrorMsg(null);

    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sessionId);
    form.append("type", photoType);

    let path: string;
    let beforeUrl: string | null = null;
    try {
      const res = await fetch("/api/funnel/upload-photo", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      ({ path, before_url: beforeUrl } = await res.json() as { path: string; before_url: string | null });
    } catch {
      setStatus("error");
      setErrorMsg("Upload failed. Please try again.");
      return;
    }

    onAnswer(cfg.answerKey, path);
    if (beforeUrl && photoType === "body") onAnswer("_before_url", beforeUrl);
    trackFunnelPhotoUploaded();

    if (photoType === "body") {
      setStatus("generating");
      // Fire & forget — generation runs in background
      fetch("/api/funnel/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          photo_path: path,
          age_bracket: answers.age_bracket,
          morphology: answers.morphology,
          ethnicity: answers.ethnicity,
          social_environment: answers.social_environment,
          goals: answers.expected_results,
        }),
      }).catch(() => {});
    }

    setStatus("done");
  }

  return (
    <div className={styles.card}>
      <div className={styles.photoUploadHeader}>
        <p className={styles.eyebrow}>· Optional</p>
        <h2 className={styles.h2}>{cfg.title}</h2>
        <p className={styles.subtext}>{cfg.sub}</p>
      </div>

      {status === "idle" && (
        <>
          <div
            className={styles.photoDropZone}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className={styles.photoDropIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.photoDropLabel}>Tap to upload a photo</div>
            <div className={styles.photoDropSub}>{cfg.hint}</div>
          </div>
        </>
      )}

      {status !== "idle" && status !== "error" && (
        <div className={styles.photoPreviewWrap}>
          {preview && (
            <img src={preview} alt="Your photo" className={styles.photoPreviewImg} />
          )}
          {!preview && status === "done" && (
            <div className={styles.photoPreviewPlaceholder}>Photo uploaded ✓</div>
          )}
          <div className={styles.photoStatusBadge}>
            {status === "uploading" && "Uploading…"}
            {status === "generating" && (
              <><span className={styles.photoSpinner} />Generating your preview…</>
            )}
            {status === "done" && (photoType === "body" ? "✓ Preview queued — ready on next page" : "✓ Photo uploaded")}
          </div>
          {(status === "done" || status === "generating") && (
            <button
              type="button"
              className={styles.photoChangeBtn}
              onClick={() => inputRef.current?.click()}
            >
              Change photo
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <div className={styles.photoErrorBox}>
          <p>{errorMsg}</p>
          <button
            type="button"
            className={styles.photoRetryBtn}
            onClick={() => { setStatus("idle"); setPreview(null); }}
          >
            Try again
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        style={{ display: "none" }}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>Back</button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          {status === "done" || status === "generating" ? "Continue →" : "Skip for now →"}
        </button>
      </div>
    </div>
  );
}

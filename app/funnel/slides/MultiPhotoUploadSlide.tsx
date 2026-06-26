"use client";

import { useRef, useState } from "react";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";
import { trackFunnelPhotoUploaded } from "../../../lib/funnel-analytics";

type PhotoType = "body" | "face" | "profile";
type SlotStatus = "idle" | "uploading" | "done" | "error";

const SLOT_CONFIG: Record<PhotoType, { label: string; hint: string; answerKey: string }> = {
  body: {
    label: "Body",
    hint: "Full or upper-body",
    answerKey: "_photo_path",
  },
  face: {
    label: "Face",
    hint: "Front-facing, close",
    answerKey: "face_photo_path",
  },
  profile: {
    label: "Profile",
    hint: "Side view",
    answerKey: "profile_photo_path",
  },
};

type Props = {
  photoTypes: PhotoType[];
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

type SlotState = { status: SlotStatus; preview: string | null; error: string | null };

export function MultiPhotoUploadSlide({ photoTypes, answers, onAnswer, onNext, onBack }: Props) {
  const sessionId = answers._session_id as string | undefined;

  const [slots, setSlots] = useState<Record<PhotoType, SlotState>>(() => {
    const init = {} as Record<PhotoType, SlotState>;
    for (const t of photoTypes) {
      const cfg = SLOT_CONFIG[t];
      init[t] = {
        status: answers[cfg.answerKey] ? "done" : "idle",
        preview: null,
        error: null,
      };
    }
    return init;
  });

  const inputRefs = useRef<Partial<Record<PhotoType, HTMLInputElement>>>({});

  const setSlot = (type: PhotoType, patch: Partial<SlotState>) =>
    setSlots((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));

  async function handleFile(type: PhotoType, file: File) {
    if (!sessionId) return;
    setSlot(type, { status: "uploading", preview: URL.createObjectURL(file), error: null });

    const form = new FormData();
    form.append("file", file);
    form.append("session_id", sessionId);
    form.append("type", type);

    let path: string;
    let beforeUrl: string | null = null;
    try {
      const res = await fetch("/api/funnel/upload-photo", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      ({ path, before_url: beforeUrl } = await res.json() as { path: string; before_url: string | null });
    } catch {
      setSlot(type, { status: "error", error: "Upload failed. Try again." });
      return;
    }

    const cfg = SLOT_CONFIG[type];
    onAnswer(cfg.answerKey, path);
    if (beforeUrl && type === "body") onAnswer("_before_url", beforeUrl);
    trackFunnelPhotoUploaded();
    setSlot(type, { status: "done" });

    if (type === "body") {
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
          goals: answers.expected_results ?? answers.dream_outcome,
        }),
      }).catch(() => {});
    }
  }

  const anyDone = photoTypes.some((t) => slots[t].status === "done");

  return (
    <div className={styles.card}>
      <div className={styles.photoUploadHeader}>
        <p className={styles.eyebrow}>· Optional</p>
        <h2 className={styles.h2}>Add your photos.</h2>
        <p className={styles.subtext}>
          The more photos you add, the more precise your projection preview.
          All optional — skip any you don&apos;t want to share.
        </p>
      </div>

      <div className={styles.multiPhotoGrid}>
        {photoTypes.map((type) => {
          const cfg = SLOT_CONFIG[type];
          const slot = slots[type];
          return (
            <div key={type} className={styles.multiPhotoSlot}>
              <button
                type="button"
                className={`${styles.multiPhotoZone} ${slot.status === "done" ? styles.multiPhotoZoneDone : ""} ${slot.status === "error" ? styles.multiPhotoZoneError : ""}`}
                onClick={() => inputRefs.current[type]?.click()}
              >
                {slot.status === "uploading" && (
                  <span className={styles.photoSpinner} />
                )}
                {slot.status === "done" && slot.preview && (
                  <img src={slot.preview} alt={cfg.label} className={styles.multiPhotoThumb} />
                )}
                {slot.status === "done" && !slot.preview && (
                  <span className={styles.multiPhotoCheck}>✓</span>
                )}
                {(slot.status === "idle" || slot.status === "error") && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
              <p className={styles.multiPhotoLabel}>{cfg.label}</p>
              <p className={styles.multiPhotoHint}>
                {slot.status === "error" ? slot.error : cfg.hint}
              </p>
              <input
                ref={(el) => { if (el) inputRefs.current[type] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif"
                style={{ display: "none" }}
                onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(type, file);
                }}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>Back</button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          {anyDone ? "Continue →" : "Skip for now →"}
        </button>
      </div>
    </div>
  );
}

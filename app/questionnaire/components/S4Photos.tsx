"use client";

import { useState, useRef, useCallback } from "react";
import type { SectionProps, Answers } from "../QuestionnaireFlow";
import { SectionHeader, SectionFooter } from "./shared";

type PhotoSlot = "front" | "side" | "back" | "face";

const PHOTO_SLOTS: {
  slot: PhotoSlot;
  label: string;
  sublabel: string;
  field: keyof Answers;
  icon: string;
}[] = [
  { slot: "front", label: "Front", sublabel: "Full body, face visible", field: "photo_front_path", icon: "↑" },
  { slot: "side", label: "Side (left)", sublabel: "Full body, left side", field: "photo_side_path", icon: "→" },
  { slot: "back", label: "Back", sublabel: "Full body, back to camera", field: "photo_back_path", icon: "↓" },
  { slot: "face", label: "Face", sublabel: "Shoulders up, neutral", field: "photo_face_path", icon: "◎" },
];

function PhotoUploader({
  slot,
  label,
  sublabel,
  icon,
  uploaded,
  onUploaded,
}: {
  slot: PhotoSlot;
  label: string;
  sublabel: string;
  icon: string;
  uploaded: boolean;
  onUploaded: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Max 10 MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError("JPG, PNG or HEIC only");
      return;
    }

    setUploadError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("slot", slot);

    try {
      const res = await fetch("/api/questionnaire/upload-photo", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setUploadError(data.error ?? "Upload failed");
        setPreview(null);
        return;
      }
      const data = (await res.json()) as { path: string };
      onUploaded(data.path);
    } catch {
      setUploadError("Network error");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [slot, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
        className={`relative rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer ${
          preview
            ? "border-wire cursor-default"
            : isDragging
            ? "border-void bg-void/[0.03]"
            : uploaded
            ? "border-wire"
            : "border-dashed border-wire hover:border-void/30 hover:bg-void/[0.015]"
        }`}
        style={{ aspectRatio: "3/4" }}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="w-full h-full object-cover" />

            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin mb-2" />
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider">Uploading</span>
              </div>
            )}

            {/* Success badge */}
            {!uploading && uploaded && (
              <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-void shadow-sm">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2.5 6.5l3 3 5-5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            {/* Replace button */}
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="absolute bottom-0 left-0 right-0 bg-void/65 backdrop-blur-sm py-2 text-[11px] font-semibold uppercase tracking-wider text-white/80 hover:text-white hover:bg-void/80 transition-all duration-150"
              >
                Replace
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-2xl text-mute">{icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-dim">{label}</span>
            <span className="text-center text-[10px] text-mute leading-snug">{sublabel}</span>
            {isDragging && (
              <span className="absolute inset-0 flex items-center justify-center bg-white/90 text-[11px] font-bold uppercase tracking-wider text-void">
                Drop here
              </span>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-center text-[11px] text-red-500">{uploadError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function S4Photos({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!instructionsAccepted) return setError("Please confirm you've read the photo instructions.");
    if (!answers.photo_front_path) return setError("Please upload your front photo.");
    if (!answers.photo_side_path) return setError("Please upload your side photo.");
    if (!answers.photo_back_path) return setError("Please upload your back photo.");
    if (!answers.photo_face_path) return setError("Please upload your face photo.");
    setError(null);
    setAnswer("photos_taken_correctly", true);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 4 — Photos"
        title="Your photos."
        subtitle="4 photos taken under specific conditions. This is the most important part of your assessment."
      />

      {/* Instructions */}
      <div className="mb-6 rounded-xl border border-wire bg-white p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-mute mb-4">
          Photo instructions
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          {[
            "Morning, empty stomach",
            "Fitted underwear only",
            "Neutral overhead lighting",
            "Plain light background",
            "Phone at chest height, ~2m away",
            "Arms slightly away, relaxed",
            "Look straight ahead",
            "Don't flex or suck in",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="mt-0.5 text-[10px] text-mute">—</span>
              <span className="text-[12px] leading-snug text-dim">{item}</span>
            </div>
          ))}
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-mute">
          Photos are encrypted and stored privately. Deleted after 12 weeks unless you opt to keep them.
        </p>
        <label className="flex cursor-pointer items-start gap-3">
          <div
            onClick={() => setInstructionsAccepted((v) => !v)}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer ${
              instructionsAccepted ? "border-void bg-void" : "border-wire hover:border-void/40"
            }`}
          >
            {instructionsAccepted && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
                <path d="M1.5 4.5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-[12.5px] font-semibold text-void leading-snug">
            I&apos;ve read the instructions and I&apos;m ready to upload
          </span>
        </label>
      </div>

      {/* 2×2 Photo grid */}
      <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${
        instructionsAccepted ? "opacity-100" : "opacity-30 pointer-events-none"
      }`}>
        {PHOTO_SLOTS.map(({ slot, label, sublabel, icon, field }) => (
          <PhotoUploader
            key={slot}
            slot={slot}
            label={label}
            sublabel={sublabel}
            icon={icon}
            uploaded={!!answers[field]}
            onUploaded={(path) => setAnswer(field, path)}
          />
        ))}
      </div>

      <SectionFooter
        onNext={handleNext}
        onBack={onBack}
        saving={saving}
        error={error ?? serverError}
      />
    </div>
  );
}

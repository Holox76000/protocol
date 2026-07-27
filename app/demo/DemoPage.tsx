"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DATING_QUESTIONS } from "../../lib/datingQuestionnaire";
import "../f1/f1.css";
import "../f1/offer/f1-offer.css";
import "../dating/dating.css";
import "./demo.css";

const MAX_PHOTOS = 12;
const MIN_PHOTOS = 1;

const RESULTS = [
  { key: "casual", label: "Casual", src: "/dating/casual.webp" },
  { key: "outdoor", label: "Outdoor", src: "/dating/outdoor.webp" },
  { key: "night", label: "Night out", src: "/dating/night.webp" },
  { key: "athletic", label: "Athletic", src: "/dating/athletic.webp" },
];

const GENERATION_STEPS = [
  "Training your private model…",
  "Calibrating to your answers…",
  "Shooting casual…",
  "Shooting outdoor…",
  "Shooting night out…",
  "Shooting athletic…",
  "Retouching light and framing…",
];

// Shared with the real /dating/success flow — see lib/datingQuestionnaire.
const QUESTIONS = DATING_QUESTIONS;

type Stage = "questions" | "upload" | "generating" | "results";

export default function DemoPage() {
  const [stage, setStage] = useState<Stage>("questions");
  const [qIndex, setQIndex] = useState(0);
  const [draft, setDraft] = useState<string>("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [genStep, setGenStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Materialize before setState: the FileList is live and gets emptied when
    // the input is cleared below, before React runs the updater.
    const incoming = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...incoming.slice(0, MAX_PHOTOS - prev.length)]);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (!draft.trim()) return;
    if (qIndex + 1 >= QUESTIONS.length) {
      setStage("upload");
    } else {
      setQIndex(qIndex + 1);
      setDraft("");
    }
  }, [qIndex, draft]);

  useEffect(() => {
    if (stage !== "generating") return;
    const total = 6500;
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      setProgress(pct);
      setGenStep(Math.min(GENERATION_STEPS.length - 1, Math.floor((elapsed / total) * GENERATION_STEPS.length)));
      if (elapsed >= total) {
        window.clearInterval(tick);
        setStage("results");
      }
    }, 120);
    return () => window.clearInterval(tick);
  }, [stage]);

  return (
    <div className="mo-page dt-success dt-demo">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Protocol <em>Dating</em></div>
        <a className="dt-demo__nav-link" href="/dating">← Back to the offer</a>
      </nav>

      <main className="dt-success__main">
        {stage === "questions" && (
          <div className="dt-success__card">
            <p className="mo-hero__eyebrow">About you</p>
            <h1 className="dt-success__title">{QUESTIONS[qIndex].q}</h1>
            <p className="dt-success__muted">
              Your answers calibrate the shoot — settings, outfits, framing. Be specific.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleNextQuestion();
                }
              }}
              placeholder={QUESTIONS[qIndex].placeholder}
              maxLength={1000}
              rows={4}
              className="dt-questionnaire__textarea"
              autoFocus
            />
            <div className="dt-questionnaire__actions">
              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={!draft.trim()}
                className="dt-btn mo-cta mo-cta--hero"
              >
                {qIndex + 1 === QUESTIONS.length ? "Done — upload photos" : "Next →"}
              </button>
            </div>
            <p className="dt-success__count">
              Question {qIndex + 1}/{QUESTIONS.length} · {draft.length}/1000
            </p>
          </div>
        )}

        {stage === "upload" && (
          <div className="dt-success__card">
            <p className="mo-hero__eyebrow">Demo</p>
            <h1 className="dt-success__title">Upload a few photos. See what we&rsquo;d shoot.</h1>
            <p className="dt-success__muted">
              Selfies are fine — different angles, good light. This is a demo:
              your photos never leave your browser.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="dt-upload-grid">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Photo ${i + 1}`} className="dt-upload-thumb" />
              ))}
              {previews.length < MAX_PHOTOS && (
                <button type="button" className="dt-upload-add" onClick={() => inputRef.current?.click()}>
                  + Add photos
                </button>
              )}
            </div>

            <p className="dt-success__count">{previews.length}/{MAX_PHOTOS} photos</p>

            <button
              type="button"
              className="dt-btn mo-cta mo-cta--hero"
              onClick={() => setStage("generating")}
              disabled={previews.length < MIN_PHOTOS}
            >
              Generate my photos
            </button>
          </div>
        )}

        {stage === "generating" && (
          <div className="dt-success__card dt-demo__gen">
            <p className="mo-hero__eyebrow">AI studio</p>
            <h1 className="dt-success__title">Shooting you in 5 styles.</h1>
            <p className="dt-success__muted dt-demo__gen-step">{GENERATION_STEPS[genStep]}</p>
            <div className="dt-demo__bar">
              <div className="dt-demo__bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="dt-success__count">{progress}%</p>
          </div>
        )}

        {stage === "results" && (
          <div className="dt-success__card dt-demo__results-card">
            <p className="mo-hero__eyebrow">Your set is ready</p>
            <h1 className="dt-success__title">Photos that get you matches.</h1>
            <p className="dt-success__muted">
              A sample of the set — the full delivery is 30 photos across 5 styles,
              in your inbox within 24 hours.
            </p>

            <div className="dt-demo__results-grid">
              {RESULTS.map((r, i) => (
                <figure key={r.key} className="dt-demo__result" style={{ animationDelay: `${i * 180}ms` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.src} alt={`${r.label} style`} />
                  <figcaption>{r.label}</figcaption>
                </figure>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

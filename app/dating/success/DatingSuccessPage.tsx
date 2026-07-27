"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { DATING_QUESTIONS, type DatingAnswers } from "../../../lib/datingQuestionnaire";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../dating.css";

const MIN_PHOTOS = 6;
const MAX_PHOTOS = 12;

type OrderState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "questions"; email: string; existingAnswers: DatingAnswers | null }
  | { status: "ready"; email: string }
  | { status: "done"; email: string };

export default function DatingSuccessPage() {
  const [order, setOrder] = useState<OrderState>({ status: "loading" });
  const [sessionId, setSessionId] = useState<string>("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) {
      setOrder({ status: "invalid" });
      return;
    }
    setSessionId(sid);
    trackGa4Event("dating_success_viewed", { funnel: "dating", page_path: "/dating/success" });

    // Retry transient failures (cold start, network blip) — a customer who
    // paid 10 seconds ago must not land on "order not found" because of a 500.
    const loadOrder = async () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch(`/api/dating/order?session_id=${encodeURIComponent(sid)}`);
          if (res.ok) {
            const data = (await res.json()) as {
              status: string;
              email: string;
              photosCount: number;
              questionnaireDone: boolean;
              questionnaireAnswers: DatingAnswers | null;
            };
            setUploadedCount(data.photosCount);
            // Stage precedence:
            //   1. Beyond paid → the customer already uploaded (or we generated) → done
            //   2. Paid + questionnaire not done → questions
            //   3. Paid + questionnaire done → ready (upload)
            if (data.status === "photos_uploaded" || data.status === "delivered" || data.status === "generating" || data.status === "generated") {
              setOrder({ status: "done", email: data.email });
            } else if (!data.questionnaireDone) {
              setOrder({ status: "questions", email: data.email, existingAnswers: data.questionnaireAnswers });
            } else {
              setOrder({ status: "ready", email: data.email });
            }
            return;
          }
          if (res.status < 500) break;
        } catch {
          // network error — retry
        }
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
      setOrder({ status: "invalid" });
    };
    void loadOrder();
  }, []);

  const handleQuestionnaireDone = useCallback((answers: DatingAnswers) => {
    if (order.status !== "questions") return;
    trackGa4Event("dating_questionnaire_completed", { funnel: "dating" });
    setOrder({ status: "ready", email: order.email });
    // Nothing to await here — the API save happened inside the questionnaire
    // component right before it fired this callback.
    void answers;
  }, [order]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || uploading) return;
      setError(null);
      setUploading(true);

      const slots = MAX_PHOTOS - uploadedCount;
      const selected = Array.from(files).slice(0, slots);

      // Files go straight from the browser to storage via signed URLs —
      // serverless functions cap request bodies well under our 10 MB limit,
      // so photos must never transit the API.
      for (const file of selected) {
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is over 10 MB — please use a smaller photo.`);
          break;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        try {
          const signRes = await fetch("/api/dating/sign-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, ext }),
          });
          const sign = (await signRes.json()) as { signedUrl?: string; path?: string; error?: string };
          if (!signRes.ok || !sign.signedUrl || !sign.path) {
            setError(sign.error ?? "Upload failed — try again.");
            break;
          }

          const putRes = await fetch(sign.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!putRes.ok) {
            setError("Upload failed — try again.");
            break;
          }

          const recordRes = await fetch("/api/dating/record-photo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, path: sign.path }),
          });
          const record = (await recordRes.json()) as { photosCount?: number; error?: string };
          if (!recordRes.ok) {
            setError(record.error ?? "Upload failed — try again.");
            break;
          }

          setUploadedCount(record.photosCount ?? uploadedCount + 1);
          setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
        } catch {
          setError("Upload failed — check your connection and try again.");
          break;
        }
      }

      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [sessionId, uploadedCount, uploading]
  );

  const handleComplete = useCallback(async () => {
    if (finishing || order.status !== "ready") return;
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/dating/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        trackGa4Event("dating_upload_completed", { funnel: "dating", photos: uploadedCount });
        setOrder({ status: "done", email: order.email });
      } else {
        setError(data.error ?? "Something went wrong — try again.");
      }
    } catch {
      setError("Something went wrong — try again.");
    }
    setFinishing(false);
  }, [finishing, order, sessionId, uploadedCount]);

  return (
    <div className="mo-page dt-success">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Protocol <em>Dating</em></div>
      </nav>

      <main className="dt-success__main">
        {order.status === "loading" && (
          <div className="dt-success__card">
            <p className="dt-success__muted">Checking your order…</p>
          </div>
        )}

        {order.status === "invalid" && (
          <div className="dt-success__card">
            <h1 className="dt-success__title">We couldn&rsquo;t find your order.</h1>
            <p className="dt-success__muted">
              Use the upload link from your confirmation email, or write to hello@protocol-club.com.
            </p>
          </div>
        )}

        {order.status === "questions" && (
          <Questionnaire
            sessionId={sessionId}
            existingAnswers={order.existingAnswers}
            onDone={handleQuestionnaireDone}
          />
        )}

        {order.status === "ready" && (
          <div className="dt-success__card">
            <p className="mo-hero__eyebrow">Order confirmed</p>
            <h1 className="dt-success__title">You&rsquo;re in. Now send us your photos.</h1>
            <p className="dt-success__muted">
              Upload {MIN_PHOTOS}–{MAX_PHOTOS} recent photos — different angles, good light, face
              visible. Selfies are fine.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="dt-upload-grid">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`Photo ${i + 1}`} className="dt-upload-thumb" />
              ))}
              {uploadedCount < MAX_PHOTOS && (
                <button
                  type="button"
                  className="dt-upload-add"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading…" : "+ Add photos"}
                </button>
              )}
            </div>

            <p className="dt-success__count">
              {uploadedCount}/{MIN_PHOTOS} photos minimum
            </p>

            {error && <p className="dt-success__error">{error}</p>}

            <button
              type="button"
              className="dt-btn mo-cta mo-cta--hero"
              onClick={handleComplete}
              disabled={uploadedCount < MIN_PHOTOS || uploading || finishing}
            >
              {finishing ? "Sending…" : "Done — start my shoot"}
            </button>
          </div>
        )}

        {order.status === "done" && (
          <div className="dt-success__card">
            <p className="mo-hero__eyebrow">Photos received</p>
            <h1 className="dt-success__title">Done. Your dating photos land in your inbox within 24 hours.</h1>
            <p className="dt-success__muted">
              We&rsquo;ll send them to <strong>{order.email}</strong>. Nothing else to do.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Same UX as /demo: one question at a time, free-text answer, single POST
// on the last one. Resumes from the first unanswered question on refresh.
function Questionnaire({
  sessionId,
  existingAnswers,
  onDone,
}: {
  sessionId: string;
  existingAnswers: DatingAnswers | null;
  onDone: (answers: DatingAnswers) => void;
}) {
  const [answers, setAnswers] = useState<DatingAnswers>(existingAnswers ?? {});
  const [qIndex, setQIndex] = useState(() => {
    if (!existingAnswers) return 0;
    for (let i = 0; i < DATING_QUESTIONS.length; i++) {
      if (!existingAnswers[DATING_QUESTIONS[i].id]?.trim()) return i;
    }
    return DATING_QUESTIONS.length - 1;
  });
  const [draft, setDraft] = useState<string>(existingAnswers?.[DATING_QUESTIONS[0].id] ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = DATING_QUESTIONS[qIndex];
  const isLast = qIndex + 1 === DATING_QUESTIONS.length;
  const canSubmit = draft.trim().length > 0 && !saving;

  async function handleNext() {
    if (!canSubmit) return;
    setError(null);
    const trimmed = draft.trim();
    const next = { ...answers, [current.id]: trimmed };
    setAnswers(next);

    if (!isLast) {
      // Advance to next question, pre-fill with any existing answer for that id
      const nextIndex = qIndex + 1;
      setQIndex(nextIndex);
      setDraft(next[DATING_QUESTIONS[nextIndex].id] ?? "");
      return;
    }

    // Last answer → POST the whole set.
    setSaving(true);
    try {
      const res = await fetch("/api/dating/save-questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answers: next }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save your answers — try again.");
        setSaving(false);
        return;
      }
      onDone(next);
    } catch {
      setError("Could not save your answers — check your connection and try again.");
      setSaving(false);
    }
  }

  function handleBack() {
    if (qIndex === 0 || saving) return;
    // Save the current draft into the local answers map before moving back
    const trimmed = draft.trim();
    const withDraft = trimmed ? { ...answers, [current.id]: trimmed } : answers;
    const prevIndex = qIndex - 1;
    setAnswers(withDraft);
    setQIndex(prevIndex);
    setDraft(withDraft[DATING_QUESTIONS[prevIndex].id] ?? "");
    setError(null);
  }

  return (
    <div className="dt-success__card">
      <p className="mo-hero__eyebrow">About you</p>
      <h1 className="dt-success__title">{current.q}</h1>
      <p className="dt-success__muted">
        Your answers calibrate the shoot — settings, outfits, framing. Be specific.
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Submit on Cmd/Ctrl + Enter, mirrors chat UX.
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            void handleNext();
          }
        }}
        placeholder={current.placeholder}
        maxLength={1000}
        rows={4}
        className="dt-questionnaire__textarea"
        disabled={saving}
        autoFocus
      />
      <div className="dt-questionnaire__actions">
        <button
          type="button"
          onClick={handleBack}
          disabled={qIndex === 0 || saving}
          className="dt-btn dt-questionnaire__back"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canSubmit}
          className="dt-btn mo-cta mo-cta--hero"
        >
          {saving ? "Saving…" : isLast ? "Done — start the shoot" : "Next →"}
        </button>
      </div>
      <p className="dt-success__count">
        Question {qIndex + 1}/{DATING_QUESTIONS.length} · {draft.length}/1000
      </p>
      {error && <p className="dt-success__error">{error}</p>}
    </div>
  );
}

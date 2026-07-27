"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type GeneratedPhotoCardProps = {
  sessionId: string;
  templateSlug: string;
  initialSignedUrl: string;
  filename: string;
  initialFeedback: string | null;
};

// Interactive card for a single generated photo. Hover exposes ↻ Regen
// and 💬 Feedback buttons. Feedback opens an inline textarea; regenerating
// uses the currently saved feedback (or the text in the open textarea) as
// a corrective clause in the next Nano Banana call.
export default function GeneratedPhotoCard({
  sessionId,
  templateSlug,
  initialSignedUrl,
  filename,
  initialFeedback,
}: GeneratedPhotoCardProps) {
  const router = useRouter();
  const [signedUrl, setSignedUrl] = useState(initialSignedUrl);
  const [feedback, setFeedback] = useState(initialFeedback ?? "");
  const [savedFeedback, setSavedFeedback] = useState(initialFeedback ?? "");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [busy, setBusy] = useState<null | "regen" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // Bust the browser cache after regen — same signed URL but new bytes.
  const [version, setVersion] = useState(0);

  const hasFeedback = savedFeedback.length > 0;

  async function saveFeedback() {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/dating/orders/${encodeURIComponent(sessionId)}/photo/${encodeURIComponent(templateSlug)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setSavedFeedback(feedback.trim());
      setFlash(feedback.trim() ? "Feedback saved." : "Feedback cleared.");
      setTimeout(() => setFlash(null), 2000);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  async function regenerate() {
    setBusy("regen");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/dating/orders/${encodeURIComponent(sessionId)}/photo/${encodeURIComponent(templateSlug)}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Send the current textarea content so an admin who typed
          // feedback and hit Regen without saving still gets it applied.
          body: JSON.stringify({ feedback: feedback.trim() }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; signedUrl?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data.signedUrl) setSignedUrl(data.signedUrl);
      setVersion((v) => v + 1);
      setSavedFeedback(feedback.trim());
      setFlash("Regenerated. New photo above.");
      setTimeout(() => setFlash(null), 2500);
      // Nudge the server component to re-read costs / paths on the next click.
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(null);
    }
  }

  const displayUrl = version === 0
    ? signedUrl
    : `${signedUrl}${signedUrl.includes("?") ? "&" : "?"}v=${version}`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-pebble bg-white transition-shadow hover:shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={displayUrl} alt={filename} className="aspect-[4/5] w-full object-cover" loading="lazy" />

      {/* Busy overlay */}
      {busy === "regen" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/85 text-[12px] font-semibold text-void">
          Regenerating… (~10–15s)
        </div>
      )}

      {/* Feedback badge (top-left) if feedback is saved */}
      {hasFeedback && (
        <div className="absolute left-2 top-2 rounded-full bg-void px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
          💬 has feedback
        </div>
      )}

      {/* Hover-visible action bar (top-right) */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <a
          href={signedUrl}
          download={filename}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-void shadow-sm hover:bg-white"
          title="Download original"
        >
          ↓
        </a>
        <button
          type="button"
          onClick={() => setFeedbackOpen((v) => !v)}
          className={`rounded-md px-2 py-1 text-[10px] font-semibold shadow-sm ${feedbackOpen ? "bg-void text-white" : "bg-white/95 text-void hover:bg-white"}`}
          title="Add / edit feedback"
        >
          💬
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={busy !== null}
          className="rounded-md bg-void px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
          title="Regenerate this photo (~$0.14)"
        >
          ↻
        </button>
      </div>

      <div className="flex items-center justify-between px-3 py-2 text-[11px]">
        <span className="truncate font-mono text-mute">{filename}</span>
      </div>

      {/* Inline feedback editor */}
      {feedbackOpen && (
        <div className="border-t border-pebble bg-ash/50 p-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-mute">
            Feedback for the next regen
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="e.g. Nose is too thin, keep the wide bulbous tip. Skin tone too warm — match the fair cool tone."
            className="w-full rounded border border-pebble bg-white px-2 py-1 text-[11px] leading-snug"
            disabled={busy !== null}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[10px] text-mute">
              {feedback.length}/2000 · {savedFeedback ? "saved" : "unsaved"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveFeedback}
                disabled={busy !== null || feedback.trim() === savedFeedback.trim()}
                className="rounded border border-pebble bg-white px-2 py-1 text-[10px] font-semibold text-void hover:bg-ash disabled:opacity-50"
              >
                {busy === "save" ? "Saving…" : "Save feedback"}
              </button>
              <button
                type="button"
                onClick={regenerate}
                disabled={busy !== null}
                className="rounded bg-void px-2 py-1 text-[10px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy === "regen" ? "Regenerating…" : "Save + regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {flash && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700">
          {flash}
        </div>
      )}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

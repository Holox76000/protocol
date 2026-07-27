"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sessionId: string;
  status: string;
  outputCount: number;
  deliverAt: string | null;
};

// Manual admin actions on a dating order. Buttons are state-aware so an
// admin can't accidentally deliver an order that hasn't been generated,
// or generate an order that hasn't uploaded photos.
export default function OrderActions({ sessionId, status, outputCount, deliverAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "generate" | "deliver" | "regenerate">(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const canGenerate = status === "paid" || status === "photos_uploaded";
  const canDeliver = status === "generated";
  const canRegenerate = status === "generated" || status === "delivered" || status === "failed";

  const now = Date.now();
  const holdRemainingMs = deliverAt ? new Date(deliverAt).getTime() - now : 0;
  const holdLabel = deliverAt && holdRemainingMs > 0
    ? `Auto-releases in ${(holdRemainingMs / 3600000).toFixed(1)}h`
    : deliverAt
      ? "Ready to release (deliver_at reached)"
      : null;

  async function run(action: "generate" | "deliver" | "regenerate", confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/admin/dating/orders/${encodeURIComponent(sessionId)}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; generated?: number };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setBusy(null);
        return;
      }
      const summary =
        action === "generate"   ? `Generated ${data.generated ?? "?"} photos. Refreshing…` :
        action === "regenerate" ? `Regenerated ${data.generated ?? "?"} photos. Refreshing…` :
                                  "Delivered — email sent, Slack pinged. Refreshing…";
      setNote(summary);
      startTransition(() => {
        router.refresh();
        setBusy(null);
      });
    } catch (err) {
      setError(String(err));
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-pebble bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Manual delivery</p>
          <p className="mt-1 text-[13px] text-mute">
            Status: <code className="text-void">{status}</code>
            {outputCount > 0 && <> · <strong className="text-void">{outputCount}</strong> generated photos on file</>}
            {holdLabel && <> · <span className="text-amber-700">{holdLabel}</span></>}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => run("generate")}
          disabled={!canGenerate || busy !== null}
          title={!canGenerate ? `Not available in status "${status}" — use Regenerate instead` : "Run generation now (~20-30s, ~$1.30)"}
          className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === "generate" ? "Generating… (~20-30s)" : "▶ Generate now"}
        </button>

        <button
          type="button"
          onClick={() => run("deliver", `Send delivery email to the customer and mark the order as delivered? This cannot be undone.`)}
          disabled={!canDeliver || busy !== null}
          title={!canDeliver ? `Requires status "generated" (current: "${status}")` : "Flip to delivered, send customer email, ping Slack"}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === "deliver" ? "Sending…" : "✓ Send to customer now"}
        </button>

        <button
          type="button"
          onClick={() => run("regenerate", `Discard the current output and generate again? Existing generated photos will be overwritten. Cost: ~$1.30.`)}
          disabled={!canRegenerate || busy !== null}
          title={!canRegenerate ? `Not available in status "${status}"` : "Overwrite generated photos with a fresh run (~$1.30)"}
          className="ml-auto rounded-lg border border-pebble bg-white px-4 py-2 text-[12px] font-semibold text-void hover:bg-ash transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === "regenerate" ? "Regenerating… (~20-30s)" : "↻ Regenerate"}
        </button>
      </div>

      {note && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
          {note}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

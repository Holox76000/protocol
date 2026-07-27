"use client";

import { useMemo, useState } from "react";

type SourcePhoto = {
  path: string;
  signedUrl: string;
  filename: string;
};

// Wraps the source-selfies grid with checkbox selection. Up to 4 refs
// can be picked; picking a 5th does nothing (checkbox is disabled).
// Every toggle triggers a save — no separate confirm button, less
// friction. Optimistic UI: state updates before the network call
// returns; if the call fails we revert + show an error.
export default function RefSelector({
  sessionId,
  photos,
  initialSelectedPaths,
  orderLabel,
}: {
  sessionId: string;
  photos: SourcePhoto[];
  initialSelectedPaths: string[];
  orderLabel: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedPaths));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_REFS = 4;
  const count = selected.size;
  const usingFallback = count === 0;

  async function persist(nextSet: Set<string>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/dating/orders/${encodeURIComponent(sessionId)}/refs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: Array.from(nextSet) }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `HTTP ${res.status}`);
        // Revert on server error.
        setSelected(new Set(initialSelectedPaths));
      }
    } catch (err) {
      setError(String(err));
      setSelected(new Set(initialSelectedPaths));
    } finally {
      setBusy(false);
    }
  }

  function toggle(path: string) {
    if (busy) return;
    const next = new Set(selected);
    if (next.has(path)) {
      next.delete(path);
    } else {
      if (next.size >= MAX_REFS) return; // silently ignore over-select
      next.add(path);
    }
    setSelected(next);
    void persist(next);
  }

  function clearAll() {
    if (busy || selected.size === 0) return;
    const next = new Set<string>();
    setSelected(next);
    void persist(next);
  }

  const helpText = useMemo(() => {
    if (usingFallback) {
      return "Nothing picked → the pipeline falls back to the first 4 photos by filename order (essentially random). Pick 1–4 to override.";
    }
    return `${count} of ${MAX_REFS} picked. These are the faces Nano Banana receives on every generation.`;
  }, [count, usingFallback]);

  return (
    <div className="mb-6 rounded-2xl border border-pebble bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Reference selfies for Nano Banana</p>
          <p className="mt-1 text-[13px] text-mute">{helpText}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${usingFallback ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {usingFallback ? "auto (fallback)" : `${count}/${MAX_REFS}`}
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={busy}
              className="rounded-md border border-pebble bg-white px-2 py-1 text-[11px] font-semibold text-void hover:bg-ash disabled:opacity-60"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-[13px] text-mute">No source photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => {
            const isSelected = selected.has(p.path);
            const disabled = !isSelected && selected.size >= MAX_REFS;
            return (
              <button
                key={p.path}
                type="button"
                onClick={() => toggle(p.path)}
                disabled={disabled || busy}
                aria-pressed={isSelected}
                title={disabled ? `${MAX_REFS} refs already picked — deselect one first` : isSelected ? "Deselect this reference" : "Use this as a reference"}
                className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-void shadow-md"
                    : disabled
                      ? "border-pebble opacity-40 cursor-not-allowed"
                      : "border-pebble hover:border-mute hover:shadow-md"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.signedUrl}
                  alt={p.filename}
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-void text-[12px] font-bold text-white shadow">
                    ✓
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <a
                    href={p.signedUrl}
                    download={p.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-void shadow-sm hover:bg-white"
                  >
                    ↓
                  </a>
                </div>
                <div className="truncate px-2 py-1.5 text-[10px] font-mono text-mute">{p.filename}</div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-dim">
        Order label: <code>{orderLabel}</code> · saves are instant, applies to future generations + regens.
      </p>
    </div>
  );
}

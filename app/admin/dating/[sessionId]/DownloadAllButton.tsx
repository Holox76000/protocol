"use client";

import { useState } from "react";

type Photo = { signedUrl: string; filename: string };

export default function DownloadAllButton({ photos, orderLabel }: { photos: Photo[]; orderLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setDone(0);

    // Sequential fetch → blob → trigger download. Sequential (not parallel)
    // so browsers don't rate-limit / block "too many downloads" and we can
    // show progress. ~200ms delay lets the browser process each save dialog.
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      try {
        const res = await fetch(p.signedUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${orderLabel}-${String(i + 1).padStart(2, "0")}-${p.filename}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setDone(i + 1);
        // Small pacing gap — Chrome throttles > 10 downloads/sec.
        await new Promise(r => setTimeout(r, 250));
      } catch (err) {
        console.error("[admin/dating] download failed", { filename: p.filename, err });
      }
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
    >
      {busy ? `Downloading ${done}/${photos.length}…` : `Download all (${photos.length})`}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../dating.css";

const MIN_PHOTOS = 6;
const MAX_PHOTOS = 12;

type OrderState =
  | { status: "loading" }
  | { status: "invalid" }
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
            const data = (await res.json()) as { status: string; email: string; photosCount: number };
            setUploadedCount(data.photosCount);
            setOrder(
              data.status === "photos_uploaded" || data.status === "delivered"
                ? { status: "done", email: data.email }
                : { status: "ready", email: data.email }
            );
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

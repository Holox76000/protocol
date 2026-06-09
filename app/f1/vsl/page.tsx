"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    _wq: unknown[];
  }
}

const DURATION = 262; // 4:22

function getInnerVideo(): HTMLVideoElement | null {
  const player = document.querySelector("wistia-player");
  if (!player) return null;
  return (
    (player as any).shadowRoot?.querySelector("video") ??
    player.querySelector("video") ??
    document.querySelector("wistia-player video")
  );
}

function VSLContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [canProceed, setCanProceed] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const canProceedRef = useRef(false);

  const offerUrl = `/f1/offer?${searchParams?.toString() ?? ""}`;

  // Trigger play + detect initial mute via _wq
  useEffect(() => {
    window._wq = window._wq || [];
    window._wq.push({
      id: "iw5y8ab8qj",
      onReady(video: { play: () => void; isMuted: () => boolean }) {
        video.play();
        setTimeout(() => setIsMuted(video.isMuted()), 800);
      },
    });
  }, []);

  // Poll the native <video> element directly every 250ms
  useEffect(() => {
    const interval = setInterval(() => {
      const video = getInnerVideo();
      if (!video || video.currentTime <= 0) return;

      const t = video.currentTime;
      const d = video.duration || DURATION;
      const realPct = t / d;

      setFakeProgress(Math.min(realPct * 3.33, 1) * 100);
      setIsMuted(video.muted);

      if (realPct >= 0.3 && !canProceedRef.current) {
        canProceedRef.current = true;
        setCanProceed(true);
        setFakeProgress(100);
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleUnmute = () => {
    const video = getInnerVideo();
    if (video) {
      video.muted = false;
      video.volume = 1;
    }
    // Also via _wq in case Wistia overrides volume
    window._wq = window._wq || [];
    window._wq.push({
      id: "iw5y8ab8qj",
      onReady(v: { unmute: () => void; volume: (n: number) => void }) {
        v.unmute();
        v.volume(1);
      },
    });
    setIsMuted(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px 48px",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, width: "100%" }}>
        <h1
          style={{
            fontSize: "clamp(18px, 4vw, 26px)",
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          Watch this before accessing your Protocol
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            margin: "0 0 24px",
          }}
        >
          Understand the science behind your results
        </p>

        {/* Video */}
        <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden" }}>
          <wistia-player
            media-id="iw5y8ab8qj"
            aspect="1.7777777777777777"
            autoplay="true"
          />
          <div style={{ position: "absolute", inset: 0, cursor: "default", zIndex: 10 }} />
        </div>

        {/* Progress bar — detached, non-interactive */}
        <div style={{ marginTop: 20, pointerEvents: "none", userSelect: "none" }}>
          <div
            style={{
              height: 4,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${fakeProgress}%`,
                background: canProceed
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : "linear-gradient(90deg, #d4af37, #f5d56e)",
                borderRadius: 999,
                transition: "width 0.3s linear, background 0.5s ease",
              }}
            />
          </div>
        </div>

        {/* Unmute button */}
        {isMuted && (
          <button
            type="button"
            onClick={handleUnmute}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 20,
              width: "100%",
              padding: "16px 24px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ fontSize: 20 }}>🔇</span>
            Tap to enable sound
          </button>
        )}

        {/* CTA slides in at 30% */}
        <div
          style={{
            marginTop: 24,
            overflow: "hidden",
            maxHeight: canProceed ? 120 : 0,
            opacity: canProceed ? 1 : 0,
            transition: "max-height 0.5s ease, opacity 0.4s ease",
          }}
        >
          <button
            type="button"
            onClick={() => router.push(offerUrl)}
            style={{
              display: "block",
              width: "100%",
              padding: "20px 24px",
              background: "linear-gradient(135deg, #d4af37, #f5d56e)",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 12,
              fontSize: 20,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            See my Protocol →
          </button>
        </div>

        {!canProceed && (
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginTop: 18,
            }}
          >
            Continue watching to unlock your personalized protocol
          </p>
        )}
      </div>
    </div>
  );
}

export default function VSLPage() {
  return (
    <>
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script
        src="https://fast.wistia.com/embed/iw5y8ab8qj.js"
        strategy="afterInteractive"
        type="module"
      />
      <Suspense>
        <VSLContent />
      </Suspense>
    </>
  );
}

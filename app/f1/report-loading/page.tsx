"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = [
  "Analyzing your body type...",
  "Calculating composition targets...",
  "Generating your transformation projection...",
  "Building your personalized protocol...",
  "Analysis ready.",
];

const POLL_INTERVAL = 6000;
const MAX_ATTEMPTS = 15; // ~90s before graceful fallback

function ReportLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const attemptsRef = useRef(0);
  const redirectedRef = useRef(false);

  const sid = searchParams?.get("funnel_sid");

  const redirect = () => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(`/f1/report/${encodeURIComponent(sid ?? "")}`);
  };

  // Progress the checklist at fixed intervals
  useEffect(() => {
    if (activeStep >= STEPS.length - 1) return;
    const delay = activeStep === 0 ? 800 : 3200;
    const t = setTimeout(() => setActiveStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [activeStep]);

  // Poll for before/after generation
  useEffect(() => {
    if (!sid) {
      redirect();
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/funnel/session?id=${encodeURIComponent(sid)}`);
        if (!res.ok) { redirect(); return; }

        const data = await res.json() as {
          status: string;
          before_url?: string;
          after_url?: string;
        };

        if (data.status === "done" && data.before_url && data.after_url) {
          setActiveStep(STEPS.length - 1);
          setTimeout(() => redirect(), 800);
        } else if (attemptsRef.current < MAX_ATTEMPTS) {
          attemptsRef.current++;
          setTimeout(poll, POLL_INTERVAL);
        } else {
          // Timeout — show report without images
          redirect();
        }
      } catch {
        redirect();
      }
    };

    const t = setTimeout(poll, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0c0b",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>

        {/* Spinner */}
        <div style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.1)",
            borderTopColor: "#8AACB8",
            animation: "spin 1s linear infinite",
          }} />
        </div>

        <h1 style={{
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
          fontFamily: "'Source Serif 4', Georgia, serif",
        }}>
          Generating your analysis
        </h1>
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
          margin: "0 0 8px",
          lineHeight: 1.6,
        }}>
          We're generating your body projection from your photo.
        </p>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 48px",
          lineHeight: 1.6,
        }}>
          This usually takes 30 to 60 seconds.<br />
          <strong style={{ color: "#fff", fontWeight: 600 }}>Please don't close or leave this page</strong> until your report is ready.
        </p>

        {/* Checklist */}
        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
          {STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div key={step} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: done || active ? 1 : 0.25,
                transition: "opacity 0.4s ease",
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: done ? "#4a7a5e" : active ? "#8AACB8" : "rgba(255,255,255,0.2)",
                  boxShadow: active ? "0 0 0 3px rgba(138,172,184,0.2)" : "none",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                }} />
                <span style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
                  color: done ? "rgba(255,255,255,0.4)" : active ? "#fff" : "rgba(255,255,255,0.25)",
                  transition: "color 0.3s ease",
                }}>
                  {done ? step.replace("...", " ✓") : step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Email backup notice — reduces drop-off if the user closes the tab */}
        <div style={{
          marginTop: 40,
          padding: "14px 18px",
          background: "rgba(138,172,184,0.08)",
          border: "1px solid rgba(138,172,184,0.18)",
          borderRadius: 10,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          textAlign: "left",
        }}>
          <span style={{
            fontSize: 16,
            lineHeight: 1.4,
            flexShrink: 0,
            color: "#8AACB8",
          }} aria-hidden="true">✉</span>
          <p style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.75)",
          }}>
            We're also sending your report to your email. If something interrupts you, the link will be waiting in your inbox.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function ReportLoadingPage() {
  return (
    <Suspense>
      <ReportLoadingContent />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  firstName: string | null;
  initialScore: number;
  templateOptions: Array<{ slug: string; label: string }>;
};

const INTENT_OPTIONS = [
  { value: "using_now",   label: "Yes, using them today" },
  { value: "after_tweak", label: "Yes, after a few tweaks" },
  { value: "not_for_me",  label: "No, they don't feel like me" },
];

function reasonPrompt(score: number) {
  if (score <= 6) return "What let you down?";
  if (score <= 8) return "What would push you to a 10?";
  return "What did you love most?";
}

export default function NpsDatingForm({ token, firstName, initialScore, templateOptions }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [reason, setReason] = useState("");
  const [favorite, setFavorite] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = firstName ?? "there";
  const canSubmit = reason.trim().length > 0 && !!intent && (templateOptions.length === 0 || !!favorite);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/nps/dating/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, score, reason: reason.trim(), favorite, intent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong");
      }
      router.push("/nps/thanks?category=dating");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ margin: "0 0 40px", fontSize: 12, fontWeight: 600, color: "#7f949b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Protocol Club
      </p>

      <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 400, color: "#253239", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
        Quick feedback, {name}?
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: 15, color: "#515255", lineHeight: 1.65 }}>
        How likely are you to recommend Protocol Dating to a friend?
      </p>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = n === score;
            const bg = selected
              ? n >= 9 ? "#4a7a5e" : n >= 7 ? "#7a6a2e" : "#253239"
              : n >= 9 ? "#e8f2ec" : n >= 7 ? "#f5f3e8" : "#edf0f1";
            const color = selected ? "#ffffff" : n >= 9 ? "#4a7a5e" : n >= 7 ? "#7a6a2e" : "#515255";
            return (
              <button
                key={n}
                onClick={() => setScore(n)}
                style={{
                  width: 44, height: 44, borderRadius: 8, border: "none",
                  background: bg, color, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "background 0.15s",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 11, color: "#7f949b" }}>Not likely</span>
          <span style={{ fontSize: 11, color: "#7f949b" }}>Extremely likely</span>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#253239", marginBottom: 8 }}>
          {reasonPrompt(score)} <span style={{ color: "#8b3a3a" }}>*</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          rows={3}
          style={{
            width: "100%", borderRadius: 8, border: "1.5px solid #dfe4e6",
            padding: "10px 12px", fontSize: 14, color: "#253239",
            fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {templateOptions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#253239", marginBottom: 8 }}>
            Which photo would you use first on your profile? <span style={{ color: "#8b3a3a" }}>*</span>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {templateOptions.map((t) => (
              <label key={t.slug} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                borderRadius: 8, cursor: "pointer",
                border: favorite === t.slug ? "1.5px solid #253239" : "1.5px solid #dfe4e6",
                background: favorite === t.slug ? "#f2f4f5" : "#ffffff",
              }}>
                <input
                  type="radio"
                  name="favorite"
                  checked={favorite === t.slug}
                  onChange={() => setFavorite(t.slug)}
                  style={{ accentColor: "#253239" }}
                />
                <span style={{ fontSize: 14, color: "#253239" }}>{t.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#253239", marginBottom: 8 }}>
          Will you use them on your dating apps? <span style={{ color: "#8b3a3a" }}>*</span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {INTENT_OPTIONS.map((opt) => (
            <label key={opt.value} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 8, cursor: "pointer",
              border: intent === opt.value ? "1.5px solid #253239" : "1.5px solid #dfe4e6",
              background: intent === opt.value ? "#f2f4f5" : "#ffffff",
            }}>
              <input
                type="radio"
                name="intent"
                checked={intent === opt.value}
                onChange={() => setIntent(opt.value)}
                style={{ accentColor: "#253239" }}
              />
              <span style={{ fontSize: 14, color: "#253239" }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: "#8b3a3a", marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        style={{
          display: "block", width: "100%", padding: "14px 0",
          background: canSubmit && !submitting ? "#253239" : "#dfe4e6",
          color: canSubmit && !submitting ? "#ffffff" : "#7f949b",
          border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
          cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
          transition: "background 0.15s",
        }}
      >
        {submitting ? "Sending..." : "Submit"}
      </button>
    </div>
  );
}

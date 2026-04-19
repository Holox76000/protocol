"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
  initialScore: number;
  is30d: boolean;
};

const DETRACTOR_QUESTIONS = [
  { key: "q1", label: "What didn't meet your expectations?", required: true },
  { key: "q2", label: "What would have made this better?", required: true },
];

const PASSIVE_QUESTIONS = [
  { key: "q1", label: "What's the one thing that's missing?", required: true },
  { key: "q2", label: "What were you expecting to find that wasn't there?", required: false },
];

function getCategory(score: number) {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export default function NpsForm({ token, initialScore, is30d }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testimonial, setTestimonial] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = getCategory(score);

  const questions =
    category === "detractor" ? DETRACTOR_QUESTIONS :
    category === "passive"   ? PASSIVE_QUESTIONS   : [];

  const isValid = () => {
    if (category === "promoter") return testimonial.trim().length > 0 && consent;
    return questions
      .filter(q => q.required)
      .every(q => (answers[q.key] ?? "").trim().length > 0);
  };

  const handleSubmit = async () => {
    if (!isValid() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/nps/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          score,
          answers: category !== "promoter"
            ? questions.map(q => ({ question: q.label, answer: answers[q.key] ?? "" }))
            : null,
          testimonial: category === "promoter" ? testimonial : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong");
      }

      const { category: submittedCategory } = await res.json() as { category: string };
      router.push(`/nps/thanks?category=${submittedCategory}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      {/* Wordmark */}
      <p style={{ margin: "0 0 40px", fontSize: 12, fontWeight: 600, color: "#7f949b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Protocol Club
      </p>

      <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 400, color: "#253239", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
        {is30d ? "30 days in — how's it going?" : "A quick question."}
      </h1>
      <p style={{ margin: "0 0 32px", fontSize: 15, color: "#515255", lineHeight: 1.65 }}>
        How likely are you to recommend Protocol Club to a friend?
      </p>

      {/* Score selector */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
            const selected = n === score;
            const bg = selected
              ? n >= 9 ? "#4a7a5e" : n >= 7 ? "#7a6a2e" : "#253239"
              : n >= 9 ? "#e8f2ec" : n >= 7 ? "#f5f3e8" : "#edf0f1";
            const color = selected ? "#ffffff" : n >= 9 ? "#4a7a5e" : n >= 7 ? "#7a6a2e" : "#515255";
            return (
              <button
                key={n}
                onClick={() => { setScore(n); setAnswers({}); setTestimonial(""); setConsent(false); }}
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

      {/* Questionnaire — detractors and passives */}
      {category !== "promoter" && (
        <div style={{ marginBottom: 24 }}>
          {questions.map(q => (
            <div key={q.key} style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#253239", marginBottom: 8 }}>
                {q.label} {q.required && <span style={{ color: "#8b3a3a" }}>*</span>}
              </label>
              <textarea
                value={answers[q.key] ?? ""}
                onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                rows={3}
                style={{
                  width: "100%", borderRadius: 8, border: "1.5px solid #dfe4e6",
                  padding: "10px 12px", fontSize: 14, color: "#253239",
                  fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Testimonial — promoters */}
      {category === "promoter" && (
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#253239", marginBottom: 8 }}>
            How would you describe your experience with Protocol Club? <span style={{ color: "#8b3a3a" }}>*</span>
          </label>
          <textarea
            value={testimonial}
            onChange={e => setTestimonial(e.target.value)}
            rows={4}
            placeholder="I've been using Protocol Club for a month and..."
            style={{
              width: "100%", borderRadius: 8, border: "1.5px solid #dfe4e6",
              padding: "10px 12px", fontSize: 14, color: "#253239",
              fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 14, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ marginTop: 2, accentColor: "#4a7a5e", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "#515255", lineHeight: 1.5 }}>
              I agree that Protocol Club may use this testimonial in marketing materials.
            </span>
          </label>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: "#8b3a3a", marginBottom: 16 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid() || submitting}
        style={{
          display: "block", width: "100%", padding: "14px 0",
          background: isValid() && !submitting ? "#253239" : "#dfe4e6",
          color: isValid() && !submitting ? "#ffffff" : "#7f949b",
          border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600,
          cursor: isValid() && !submitting ? "pointer" : "not-allowed",
          transition: "background 0.15s",
        }}
      >
        {submitting ? "Sending..." : "Submit"}
      </button>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect } from "./shared";

// City input with native browser autocomplete (geolocation API not needed)
function CityInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQuery = useRef<string>("");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      latestQuery.current = query;
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&layer=city&lang=en`
        );
        if (latestQuery.current !== query) return;
        const data = await res.json() as {
          features: Array<{
            properties: {
              name?: string;
              state?: string;
              country?: string;
              countrycode?: string;
            };
          }>;
        };
        const names = data.features
          .map((f) => {
            const city = f.properties.name ?? "";
            if (!city) return "";
            const cc = (f.properties.countrycode ?? "").toUpperCase();
            const state = f.properties.state ?? "";
            if ((cc === "US" || cc === "CA") && state) return `${city}, ${state}`;
            const country = f.properties.country ?? "";
            return [city, country].filter(Boolean).join(", ");
          })
          .filter(Boolean);
        const unique = [...new Set(names)];
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Paris, London, New York…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          fetchSuggestions(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
      />
      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-black/10 bg-white shadow-md overflow-hidden">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(s); setSuggestions([]); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-ash transition"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const GOAL_OPTIONS = [
  { value: "sharpen_proportions", label: "Sharpen my proportions", sublabel: "Optimize my shoulder-to-waist ratio and silhouette" },
  { value: "build_muscle", label: "Build lean muscle", sublabel: "Increase mass in the right places" },
  { value: "reshape", label: "Reshape my body", sublabel: "Significant change in overall physique" },
  { value: "improve_posture", label: "Improve my posture and presence", sublabel: "Carry myself differently" },
  { value: "full_transformation", label: "Full transformation", sublabel: "All of the above" },
];

const MOTIVATION_OPTIONS = [
  { value: "relationship", label: "Dating and relationships — I want to be more attractive to partners" },
  { value: "confidence", label: "Self-confidence — I want to feel better about how I look" },
  { value: "professional", label: "Professional presence — how I'm perceived at work matters" },
  { value: "performance", label: "Athletic performance — I want to look and perform like an athlete" },
  { value: "health", label: "Health and longevity — I want a body that lasts" },
];

export default function S1Identity({ answers, setAnswer, onNext, onBack, saving, serverError, isFirst }: SectionProps & { isFirst?: boolean }) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!answers.first_name?.trim()) return setError("Please enter your first name.");
    if (!answers.phone?.trim()) return setError("Please enter your phone number.");
    if (!answers.city?.trim()) return setError("Please enter your city.");
    if (!answers.goal) return setError("Please select a primary goal.");
    if (!answers.motivation) return setError("Please select a motivation.");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 1 — Identity"
        title="Let's start with you."
        subtitle="These answers shape the direction of your entire Protocol."
      />

      <div className="flex flex-col gap-8">
        <Field label="What's your first name?" sublabel="Used to personalize your Protocol report." required>
          <input
            type="text"
            placeholder="Thomas"
            value={answers.first_name ?? ""}
            onChange={(e) => setAnswer("first_name", e.target.value)}
            maxLength={50}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
          />
        </Field>

        <Field label="Phone number" sublabel="So your coach can reach you if needed." required>
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            value={answers.phone ?? ""}
            onChange={(e) => setAnswer("phone", e.target.value)}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
          />
        </Field>

        <Field label="City" sublabel="Helps us tailor recommendations to your context." required>
          <CityInput value={answers.city ?? ""} onChange={(v) => setAnswer("city", v)} />
        </Field>

        <Field label="What's your primary goal with this Protocol?" sublabel="Pick the one that matters most right now." required>
          <CardSelect
            value={answers.goal}
            onChange={(v) => setAnswer("goal", v)}
            options={GOAL_OPTIONS}
          />
        </Field>

        <Field label="What's driving this for you right now?" sublabel="Be honest — this helps us prioritize what matters in your Protocol." required>
          <CardSelect
            value={answers.motivation}
            onChange={(v) => setAnswer("motivation", v)}
            options={MOTIVATION_OPTIONS}
          />
        </Field>
      </div>

      <SectionFooter
        onNext={handleNext}
        onBack={onBack}
        saving={saving}
        error={error ?? serverError}
        isFirst={isFirst}
      />
    </div>
  );
}

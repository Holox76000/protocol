"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CalibrationMetrics, OverlayPoints } from "../admin/orders/[userId]/PhotoCalibrator";
import type { ProtocolSections } from "../../lib/parseProtocolSections";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MetricsPanel from "./MetricsPanel";
import CalibrationReport from "./CalibrationReport";
import ProtocolView from "./ProtocolView";

// ── Section IDs ─────────────────────────────────────────────────────────────

type SectionId =
  | "summary"
  | "body-analysis"
  | "action-plan"
  | "daily-protocol"
  | "nutrition-plan"
  | "workout-plan"
  | "sleeping-advices"
  | "posture-analysis";

// ── Nav structure ───────────────────────────────────────────────────────────

type NavGroup = { group: string };
type NavItem  = { id: SectionId; label: string; icon: string };
type NavEntry = NavGroup | NavItem;

const NAV: NavEntry[] = [
  { id: "summary",          label: "Summary Report",   icon: "≡"  },
  { id: "body-analysis",    label: "Body Analysis",    icon: "◎"  },
  { id: "action-plan",      label: "Action Plan",      icon: "✓"  },
  { group: "Lifestyle" },
  { id: "daily-protocol",   label: "Daily Protocol",   icon: "+"  },
  { id: "nutrition-plan",   label: "Nutrition Plan",   icon: "≡"  },
  { id: "workout-plan",     label: "Workout Plan",     icon: "›"  },
  { id: "sleeping-advices", label: "Sleeping Advices", icon: "◇"  },
  { id: "posture-analysis", label: "Posture Analysis", icon: "↕"  },
];

const SECTION_LABELS: Record<SectionId, string> = {
  "summary":          "Summary Report",
  "body-analysis":    "Body Analysis",
  "action-plan":      "Action Plan",
  "daily-protocol":   "Daily Protocol",
  "nutrition-plan":   "Nutrition Plan",
  "workout-plan":     "Workout Plan",
  "sleeping-advices": "Sleeping Advices",
  "posture-analysis": "Posture Analysis",
};

const LIFESTYLE_IDS = new Set<SectionId>([
  "daily-protocol", "nutrition-plan", "workout-plan", "sleeping-advices",
]);

function isNavItem(e: NavEntry): e is NavItem {
  return "id" in e;
}

// ── Props ───────────────────────────────────────────────────────────────────

type Props = {
  email:                  string;
  userId:                 string;
  firstName:              string;
  deliveredDate:          string | null;
  metrics:                CalibrationMetrics | null;
  points:                 OverlayPoints | null;
  photoFront:             string | null;
  photoSide:              string | null;
  heightCm?:              number;
  age?:                   number;
  sections:               ProtocolSections;
  beforeAfterPreviewPath: string | null;
  summary:                string | null;
  nutritionPlanContent:   string | null;
  workoutPlanContent:     string | null;
  sleepingAdvicesContent: string | null;
  dailyProtocolContent:   string | null;
  actionPlanContent:      string | null;
};

// ── Component ───────────────────────────────────────────────────────────────

export default function ProtocolSidebarLayout({
  email,
  userId,
  firstName,
  deliveredDate,
  metrics,
  points,
  photoFront,
  photoSide,
  heightCm,
  age,
  sections,
  beforeAfterPreviewPath,
  summary: initialSummary,
  nutritionPlanContent:   initialNutrition,
  workoutPlanContent:     initialWorkout,
  sleepingAdvicesContent: initialSleep,
  dailyProtocolContent:   initialDaily,
  actionPlanContent:      initialActionPlan,
}: Props) {
  const [active, setActive]         = useState<SectionId>("summary");
  const [navOpen, setNavOpen]       = useState(false);
  const [summary, setSummary]       = useState<string | null>(initialSummary);
  const [genSummary, setGenSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // ── Generated section content ─────────────────────────────────────────
  const [nutritionContent,   setNutritionContent]   = useState<string | null>(initialNutrition);
  const [workoutContent,     setWorkoutContent]     = useState<string | null>(initialWorkout);
  const [sleepContent,       setSleepContent]       = useState<string | null>(initialSleep);
  const [dailyContent,       setDailyContent]       = useState<string | null>(initialDaily);
  const [actionPlanContent,  setActionPlanContent]  = useState<string | null>(initialActionPlan);

  const sectionStateMap: Record<string, { content: string | null; setContent: (v: string | null) => void }> = {
    "nutrition-plan":   { content: nutritionContent,  setContent: setNutritionContent  },
    "workout-plan":     { content: workoutContent,    setContent: setWorkoutContent    },
    "sleeping-advices": { content: sleepContent,      setContent: setSleepContent      },
    "daily-protocol":   { content: dailyContent,      setContent: setDailyContent      },
    "action-plan":      { content: actionPlanContent, setContent: setActionPlanContent },
  };

  // ── Summary generation ────────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    setGenSummary(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/admin/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { summary?: string; error?: string };
      if (!res.ok || data.error) {
        setSummaryError(data.error ?? "Generation failed.");
      } else {
        setSummary(data.summary ?? null);
      }
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setGenSummary(false);
    }
  };

  // ── Before/After generation state ─────────────────────────────────────
  const [beforeUrl, setBeforeUrl]   = useState<string | null>(null);
  const [afterUrl, setAfterUrl]     = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);

  // Load existing preview on mount if one was already generated
  const loadExisting = useCallback(async () => {
    if (!beforeAfterPreviewPath) return;
    const res = await fetch(`/api/admin/generate-before-after?userId=${userId}`);
    if (res.ok) {
      const data = await res.json() as { beforeUrl: string | null; afterUrl: string | null };
      setBeforeUrl(data.beforeUrl);
      setAfterUrl(data.afterUrl);
    }
  }, [beforeAfterPreviewPath, userId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/generate-before-after", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { beforeUrl?: string; afterUrl?: string; error?: string };
      if (!res.ok || data.error) {
        setGenError(data.error ?? "Generation failed.");
      } else {
        setBeforeUrl(data.beforeUrl ?? null);
        setAfterUrl(data.afterUrl  ?? null);
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Admin banner */}
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 truncate">
            Admin — {email}
          </p>
          <Link
            href={`/admin/orders/${userId}`}
            className="ml-3 shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 hover:text-amber-900"
          >
            ← Order
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ── Sidebar — desktop only ───────────────────────────────────────── */}
        <aside className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-[216px] shrink-0 overflow-y-auto border-r border-wire bg-white">
          {/* Logo + identity */}
          <div className="border-b border-wire px-5 py-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/program/static/landing/images/shared/Prtcl.png"
                alt="Protocol"
                width={20}
                height={20}
                className="w-5 h-5 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-void">
                  {firstName}&apos;s Protocol
                </p>
                {deliveredDate && (
                  <p className="text-[10px] text-mute">{deliveredDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-2.5">
            {NAV.map((entry, i) => {
              if (!isNavItem(entry)) {
                return (
                  <p
                    key={i}
                    className="mb-1 mt-4 px-2.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-mute"
                  >
                    {entry.group}
                  </p>
                );
              }
              const isActive = active === entry.id;
              return (
                <button
                  key={entry.id}
                  onClick={() => setActive(entry.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isActive
                      ? "bg-void text-white"
                      : "text-dim hover:bg-ash hover:text-void"
                  }`}
                >
                  <span className={`shrink-0 w-4 text-center text-[11px] ${isActive ? "opacity-80" : "opacity-40"}`}>
                    {entry.icon}
                  </span>
                  <span className={`text-[12.5px] ${isActive ? "font-semibold" : "font-medium"}`}>
                    {entry.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* ── Mobile sticky header ─────────────────────────────────────── */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-wire">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Identity */}
              <div className="flex items-center gap-2.5 min-w-0">
                <Image
                  src="/program/static/landing/images/shared/Prtcl.png"
                  alt="Protocol"
                  width={20}
                  height={20}
                  className="w-5 h-5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-void leading-tight">
                    {firstName}&apos;s Protocol
                  </p>
                  {deliveredDate && (
                    <p className="text-[10px] text-mute leading-tight">{deliveredDate}</p>
                  )}
                </div>
              </div>

              {/* Current section label + burger */}
              <button
                onClick={() => setNavOpen(true)}
                className="ml-3 shrink-0 flex items-center gap-2.5 rounded-xl bg-void px-3 py-2 active:opacity-80 transition-opacity"
                aria-label="Open navigation"
              >
                <span className="text-[12px] font-semibold text-white whitespace-nowrap">
                  {SECTION_LABELS[active]}
                </span>
                <div className="flex flex-col gap-[4px]">
                  <span className="block h-[1.5px] w-4 bg-white" />
                  <span className="block h-[1.5px] w-4 bg-white" />
                  <span className="block h-[1.5px] w-2.5 bg-white opacity-70" />
                </div>
              </button>
            </div>
          </div>

          {/* ── Mobile nav overlay ───────────────────────────────────────── */}
          {navOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setNavOpen(false)}
              />
              {/* Sheet */}
              <div className="relative bg-white rounded-t-2xl px-4 pt-4 pb-8 shadow-xl">
                {/* Handle */}
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wire" />
                {/* Identity */}
                <div className="mb-4 flex items-center gap-2.5">
                  <Image
                    src="/program/static/landing/images/shared/Prtcl.png"
                    alt="Protocol"
                    width={20}
                    height={20}
                    className="w-5 h-5 shrink-0"
                  />
                  <p className="text-[12px] font-semibold text-void">{firstName}&apos;s Protocol</p>
                </div>
                {/* Nav groups */}
                {NAV.map((entry, i) => {
                  if (!isNavItem(entry)) {
                    return (
                      <p key={i} className="mt-5 mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-mute px-1">
                        {entry.group}
                      </p>
                    );
                  }
                  const isActive = active === entry.id;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => { setActive(entry.id); setNavOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                        isActive ? "bg-void text-white" : "text-dim active:bg-ash"
                      }`}
                    >
                      <span className={`shrink-0 w-5 text-center text-[13px] ${isActive ? "opacity-80" : "opacity-40"}`}>
                        {entry.icon}
                      </span>
                      <span className={`text-[14px] ${isActive ? "font-semibold" : "font-medium"}`}>
                        {entry.label}
                      </span>
                      {isActive && (
                        <svg className="ml-auto w-4 h-4 opacity-60" fill="none" viewBox="0 0 16 16">
                          <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:px-8 lg:px-10 lg:py-10">
            {/* Section header */}
            <div className="mb-6 border-b border-wire pb-5 lg:mb-8 lg:pb-6">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
                {LIFESTYLE_IDS.has(active) ? "Lifestyle" : "Protocol"}
              </p>
              <h1 className="font-display text-[26px] font-normal leading-tight text-void lg:text-[32px]">
                {SECTION_LABELS[active]}
              </h1>
            </div>

            {/* ── Section content ────────────────────────────────────────── */}

            {active === "summary" && (
              <div className="space-y-10">
                {/* ── Score ── */}
                {metrics
                  ? <MetricsPanel metrics={metrics} age={age} />
                  : <EmptyState message="No metrics available." />
                }

                {/* ── Before / After ── */}
                <div>
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
                    Before / After
                  </p>
                  <BeforeAfterSection
                    userId={userId}
                    photoFront={photoFront}
                    beforeUrl={beforeUrl}
                    afterUrl={afterUrl}
                    generating={generating}
                    genError={genError}
                    hasMetrics={metrics !== null}
                    onGenerate={handleGenerate}
                    onRegenerate={handleGenerate}
                  />
                </div>

                {/* ── Generated summary ── */}
                <div>
                  {summary ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">
                          Analysis
                        </p>
                        <button
                          onClick={handleGenerateSummary}
                          disabled={genSummary}
                          className="flex items-center gap-1.5 text-[10px] font-semibold text-mute hover:text-void disabled:opacity-40 transition-colors"
                        >
                          {genSummary
                            ? <><span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" /> Generating…</>
                            : "↻ Regenerate"
                          }
                        </button>
                      </div>
                      <div className={PROSE_CLASSES}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {summary}
                        </ReactMarkdown>
                      </div>
                      {summaryError && <p className="mt-3 text-[12px] text-red-600">{summaryError}</p>}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-wire bg-ash p-6">
                      <p className="mb-1 text-[13px] font-semibold text-void">Generate Summary Report</p>
                      <p className="mb-4 text-[12.5px] leading-relaxed text-dim">
                        A personalized analysis of {metrics ? "this client's" : "the client's"} metrics, gaps, and realistic potential — written by Claude.
                      </p>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={genSummary || !metrics}
                        className="flex items-center gap-2 rounded-lg bg-void px-5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
                      >
                        {genSummary
                          ? <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
                          : "Generate Analysis"
                        }
                      </button>
                      {summaryError && <p className="mt-3 text-[12px] text-red-600">{summaryError}</p>}
                      {!metrics && <p className="mt-2 text-[11px] text-mute">Calibration required first.</p>}
                    </div>
                  )}
                </div>

              </div>
            )}

            {active === "body-analysis" && (
              metrics
                ? (
                  <CalibrationReport
                    metrics={metrics}
                    points={points}
                    photoFront={photoFront}
                    photoSide={photoSide}
                    heightCm={heightCm}
                  />
                )
                : <EmptyState message="No body metrics available." />
            )}

            {active === "action-plan" && (
              <GeneratedSection
                sectionKey="action-plan"
                userId={userId}
                label="Action Plan"
                description={`Synthesizes the nutrition, workout, sleep, and daily protocol into a prioritized transformation roadmap for ${firstName}.`}
                content={sectionStateMap["action-plan"].content}
                onContent={sectionStateMap["action-plan"].setContent}
                warningWhenEmpty={
                  !nutritionContent || !workoutContent || !sleepContent || !dailyContent
                    ? "For best results, generate all other sections first."
                    : undefined
                }
              />
            )}

            {active === "daily-protocol" && (
              <GeneratedSection
                sectionKey="daily-protocol"
                userId={userId}
                label="Daily Protocol"
                description={`A complete daily operating system for ${firstName} — morning, afternoon, and evening routines aligned with their training and nutrition.`}
                content={sectionStateMap["daily-protocol"].content}
                onContent={sectionStateMap["daily-protocol"].setContent}
              />
            )}

            {active === "nutrition-plan" && (
              <GeneratedSection
                sectionKey="nutrition-plan"
                userId={userId}
                label="Nutrition Plan"
                description={`Personalized caloric targets, macros, meal structure, food choices, and supplement protocol for ${firstName}.`}
                content={sectionStateMap["nutrition-plan"].content}
                onContent={sectionStateMap["nutrition-plan"].setContent}
              />
            )}

            {active === "workout-plan" && (
              <GeneratedSection
                sectionKey="workout-plan"
                userId={userId}
                label="Workout Plan"
                description={`A structured training program for ${firstName} based on their experience, session availability, equipment, and physique targets.`}
                content={sectionStateMap["workout-plan"].content}
                onContent={sectionStateMap["workout-plan"].setContent}
              />
            )}

            {active === "sleeping-advices" && (
              <GeneratedSection
                sectionKey="sleeping-advices"
                userId={userId}
                label="Sleeping Advices"
                description={`A complete sleep optimization protocol for ${firstName} — routines, environment, cortisol management, and supplement timing.`}
                content={sectionStateMap["sleeping-advices"].content}
                onContent={sectionStateMap["sleeping-advices"].setContent}
              />
            )}

            {active === "posture-analysis" && (
              sections.postureAnalysis
                ? <ProtocolView content={sections.postureAnalysis} showMetricLabels />
                : <EmptyState message="Posture analysis not generated yet." />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyState({ message = "No content available." }: { message?: string }) {
  return (
    <p className="text-[13px] text-mute">{message}</p>
  );
}

// ── Generated section (AI content) ──────────────────────────────────────────

const PROSE_CLASSES = `max-w-none
  [&>*+*]:mt-5

  [&_p]:text-[14px] [&_p]:leading-[1.75] [&_p]:text-void [&_p]:mb-0

  [&_strong]:font-semibold [&_strong]:text-void

  [&_h2]:font-display [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-void
  [&_h2]:mt-10 [&_h2]:mb-3
  [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-wire

  [&_h3]:text-[11px] [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-[0.16em]
  [&_h3]:text-mute [&_h3]:mt-7 [&_h3]:mb-2

  [&_ul]:my-3 [&_ul]:space-y-2 [&_ul]:list-none [&_ul]:pl-0
  [&_ul>li]:relative [&_ul>li]:pl-4
  [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.55em]
  [&_ul>li]:before:h-1 [&_ul>li]:before:w-1 [&_ul>li]:before:rounded-full
  [&_ul>li]:before:bg-dim [&_ul>li]:before:content-['']
  [&_li]:text-[14px] [&_li]:leading-[1.7] [&_li]:text-void

  [&_ol]:my-3 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:text-[14px] [&_ol>li]:leading-[1.7] [&_ol>li]:text-void

  [&_blockquote]:border-l-2 [&_blockquote]:border-wire [&_blockquote]:pl-4
  [&_blockquote]:text-[13px] [&_blockquote]:italic [&_blockquote]:text-dim [&_blockquote]:my-4

  [&_hr]:my-8 [&_hr]:border-wire

  [&_table]:w-full [&_table]:text-[13px] [&_table]:my-4
  [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-xl
  [&_thead]:bg-ash
  [&_th]:text-left [&_th]:font-semibold [&_th]:text-void [&_th]:px-3 [&_th]:py-2.5
  [&_th]:border-b [&_th]:border-wire [&_th]:whitespace-nowrap
  [&_td]:px-3 [&_td]:py-2 [&_td]:text-void [&_td]:border-b [&_td]:border-wire/60
  [&_tr:last-child_td]:border-b-0
  [&_tbody_tr:nth-child(even)]:bg-ash/50`;

function GeneratedSection({
  sectionKey,
  userId,
  label,
  description,
  content: initialContent,
  onContent,
  warningWhenEmpty,
}: {
  sectionKey:       string;
  userId:           string;
  label:            string;
  description:      string;
  content:          string | null;
  onContent:        (v: string | null) => void;
  warningWhenEmpty?: string;
}) {
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [content,    setLocalContent] = useState<string | null>(initialContent);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/generate-section", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, section: sectionKey }),
      });
      const data = await res.json() as { content?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Generation failed.");
      } else {
        const c = data.content ?? null;
        setLocalContent(c);
        onContent(c);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setGenerating(false);
    }
  };

  if (content) {
    return (
      <div>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</p>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-mute hover:text-void disabled:opacity-40 transition-colors"
          >
            {generating
              ? <><span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-current border-t-transparent" /> Generating…</>
              : "↻ Regenerate"
            }
          </button>
        </div>
        <div className={PROSE_CLASSES}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-wire bg-ash p-6">
      <p className="mb-1 text-[13px] font-semibold text-void">Generate {label}</p>
      <p className="mb-4 text-[12.5px] leading-relaxed text-dim">{description}</p>
      {warningWhenEmpty && (
        <p className="mb-4 text-[11.5px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          ⚠ {warningWhenEmpty}
        </p>
      )}
      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-2 rounded-lg bg-void px-5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {generating
          ? <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
          : `Generate ${label}`
        }
      </button>
      {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}

// ── Comparison slider ────────────────────────────────────────────────────────

function ComparisonSlider({ beforeSrc, afterSrc, onExpand, fullscreen = false }: {
  beforeSrc:  string;
  afterSrc:   string;
  onExpand:   (src: string, label: string) => void;
  fullscreen?: boolean;
}) {
  const [position, setPosition] = useState(50); // percent
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - left) / width) * 100));
    setPosition(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    updateFromEvent(e.clientX);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    updateFromEvent(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMove  = (e: MouseEvent)  => { if (dragging.current) updateFromEvent(e.clientX); };
    const onTMove = (e: TouchEvent)  => { if (dragging.current) updateFromEvent(e.touches[0].clientX); };
    const onUp    = ()               => { dragging.current = false; };
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("touchmove",  onTMove, { passive: true });
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("touchend",   onUp);
    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("touchmove",  onTMove);
      window.removeEventListener("mouseup",    onUp);
      window.removeEventListener("touchend",   onUp);
    };
  }, [updateFromEvent]);

  return (
    <div className={fullscreen ? "flex flex-col h-full" : ""}>
      {/* Labels above */}
      <div className="mb-2 flex justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-[#f0f0ef] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#888]">Before</span>
        </div>
        <div className="flex items-center gap-2">
          {!fullscreen && (
            <button
              onClick={() => onExpand(beforeSrc, "")}
              className="text-[10px] text-mute underline-offset-2 hover:underline"
            >
              expand
            </button>
          )}
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">After</span>
        </div>
      </div>

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl select-none touch-pan-y"
        style={fullscreen ? { flex: 1, minHeight: 0, cursor: "ew-resize" } : { aspectRatio: "3/4", cursor: "ew-resize" }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Before — full width base */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeSrc} alt="Before" className="absolute inset-0 h-full w-full object-cover object-top" />

        {/* After — clipped to right side of divider */}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterSrc} alt="After" className="absolute inset-0 h-full w-full object-cover object-top" />
        </div>

        {/* Divider line */}
        <div
          className="absolute inset-y-0 w-px bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]"
          style={{ left: `${position}%` }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10"
          style={{ left: `${position}%` }}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M5 1L1 6l4 5M13 1l4 5-4 5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* "Slide" hint — fades out after first interaction */}
        {position === 50 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            ← drag →
          </div>
        )}
      </div>
    </div>
  );
}

// ── Before/After section ────────────────────────────────────────────────────

function FullscreenComparison({ beforeSrc, afterSrc, onClose }: {
  beforeSrc: string;
  afterSrc:  string;
  onClose:   () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
          Before / After · drag to compare
        </span>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>
      {/* Slider — fills remaining height */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-sm h-full">
          <ComparisonSlider
            beforeSrc={beforeSrc}
            afterSrc={afterSrc}
            onExpand={() => {}}
            fullscreen
          />
        </div>
      </div>
    </div>
  );
}

function BeforeAfterSection({
  photoFront,
  beforeUrl,
  afterUrl,
  generating,
  genError,
  hasMetrics,
  onGenerate,
  onRegenerate,
}: {
  userId:       string;
  photoFront:   string | null;
  beforeUrl:    string | null;
  afterUrl:     string | null;
  generating:   boolean;
  genError:     string | null;
  hasMetrics:   boolean;
  onGenerate:   () => void;
  onRegenerate: () => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!photoFront) return <EmptyState message="No front photo found for this user." />;
  if (!hasMetrics) return <EmptyState message="Calibration metrics are required to generate the preview." />;

  // Comparison slider once generated
  if (afterUrl) {
    return (
      <div>
        {fullscreen && (
          <FullscreenComparison
            beforeSrc={beforeUrl ?? photoFront}
            afterSrc={afterUrl}
            onClose={() => setFullscreen(false)}
          />
        )}

        <ComparisonSlider
          beforeSrc={beforeUrl ?? photoFront}
          afterSrc={afterUrl}
          onExpand={() => setFullscreen(true)}
        />

        {/* Regenerate */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onRegenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-wire px-4 py-2 text-[12px] font-semibold text-dim transition-colors hover:border-void hover:text-void disabled:opacity-40"
          >
            {generating ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                Generating…
              </>
            ) : (
              "↻ Regenerate"
            )}
          </button>
          <p className="text-[11px] text-mute">Results vary — regenerate if the output is off.</p>
        </div>
        {genError && <p className="mt-3 text-[12px] text-red-600">{genError}</p>}
      </div>
    );
  }

  // Not yet generated
  return (
    <div>
      {/* Show original photo */}
      <div className="mb-6">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mute">
          Original photo
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoFront} alt="Original" className="w-full max-w-xs rounded-xl object-cover" />
      </div>

      {/* Generate CTA */}
      <div className="rounded-2xl border border-wire bg-ash p-6">
        <p className="mb-1 text-[13px] font-semibold text-void">Generate AI Before/After</p>
        <p className="mb-4 text-[12.5px] leading-relaxed text-dim">
          Uses the calibration metrics and age to project what this person could realistically look like with the recommended improvements.
        </p>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-void px-5 py-2.5 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {generating ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating — takes ~15s…
            </>
          ) : (
            "Generate Before/After"
          )}
        </button>
        {genError && <p className="mt-3 text-[12px] text-red-600">{genError}</p>}
      </div>
    </div>
  );
}

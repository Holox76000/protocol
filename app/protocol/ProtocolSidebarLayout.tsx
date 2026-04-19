"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalibrationMetrics, OverlayPoints } from "../admin/orders/[userId]/PhotoCalibrator";
import { OC } from "../../lib/overlayColors";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MetricsPanel from "./MetricsPanel";
import CalibrationReport from "./CalibrationReport";
import ProtocolView from "./ProtocolView";
import SummaryReport from "./SummaryReport";
import BodyAnalysis from "./BodyAnalysis";

// ── Section IDs ─────────────────────────────────────────────────────────────

export type SectionId =
  | "summary"
  | "body-analysis"
  | "action-plan"
  | "nutrition-plan"
  | "supplement-protocol"
  | "workout-plan"
  | "sleeping-advices"
  | "posture-analysis";

// ── Nav structure ───────────────────────────────────────────────────────────

type NavGroup = { group: string };
type NavItem  = { id: SectionId; label: string; icon: string };
type NavEntry = NavGroup | NavItem;

const NAV: NavEntry[] = [
  { id: "summary",             label: "Summary Report",      icon: "≡"  },
  { id: "body-analysis",       label: "Body Analysis",       icon: "◎"  },
  { id: "action-plan",         label: "Action Plan",         icon: "✓"  },
  { group: "Lifestyle" },
  { id: "nutrition-plan",      label: "Nutrition Plan",      icon: "≡"  },
  { id: "supplement-protocol", label: "Supplement Protocol", icon: "◈"  },
  { id: "workout-plan",        label: "Workout Plan",        icon: "›"  },
  { id: "sleeping-advices",    label: "Sleeping Advices",    icon: "◇"  },
  { id: "posture-analysis",    label: "Posture Analysis",    icon: "↕"  },
];

const SECTION_LABELS: Record<SectionId, string> = {
  "summary":             "Summary Report",
  "body-analysis":       "Body Analysis",
  "action-plan":         "Action Plan",
  "nutrition-plan":      "Nutrition Plan",
  "supplement-protocol": "Supplement Protocol",
  "workout-plan":        "Workout Plan",
  "sleeping-advices":    "Sleeping Advices",
  "posture-analysis":    "Posture Analysis",
};

const LIFESTYLE_IDS = new Set<SectionId>([
  "nutrition-plan", "supplement-protocol", "workout-plan", "sleeping-advices",
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
  weightKg?:              number;
  isAdmin?:               boolean;
  initialSection:         SectionId;
  initialBeforeUrl:       string | null;
  initialAfterUrl:        string | null;
  summary:                   string | null;
  nutritionPlanContent:      string | null;
  supplementProtocolContent: string | null;
  workoutPlanContent:        string | null;
  sleepingAdvicesContent:    string | null;
  actionPlanContent:         string | null;
  postureAnalysisContent:    string | null;
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
  weightKg,
  isAdmin = true,
  initialSection,
  initialBeforeUrl,
  initialAfterUrl,
  summary: initialSummary,
  nutritionPlanContent:      initialNutrition,
  supplementProtocolContent: initialSupplement,
  workoutPlanContent:        initialWorkout,
  sleepingAdvicesContent:    initialSleep,
  actionPlanContent:         initialActionPlan,
  postureAnalysisContent:    initialPostureAnalysis,
}: Props) {
  const router = useRouter();
  const [active, setActive]         = useState<SectionId>(initialSection);
  const [navOpen, setNavOpen]       = useState(false);
  const [summary, setSummary]       = useState<string | null>(initialSummary);
  const [genSummary, setGenSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // ── Generated section content ─────────────────────────────────────────
  const [nutritionContent,          setNutritionContent]          = useState<string | null>(initialNutrition);
  const [supplementProtocolContent, setSupplementProtocolContent] = useState<string | null>(initialSupplement);
  const [workoutContent,            setWorkoutContent]            = useState<string | null>(initialWorkout);
  const [sleepContent,              setSleepContent]              = useState<string | null>(initialSleep);
  const [actionPlanContent,         setActionPlanContent]         = useState<string | null>(initialActionPlan);
  const [postureAnalysisContent,    setPostureAnalysisContent]    = useState<string | null>(initialPostureAnalysis);

  const navigateTo = useCallback((id: SectionId) => {
    setActive(id);
    router.push(`/protocol/${encodeURIComponent(email)}/${id}`);
  }, [router, email]);

  const sectionStateMap: Record<string, { content: string | null; setContent: (v: string | null) => void }> = {
    "nutrition-plan":      { content: nutritionContent,          setContent: setNutritionContent          },
    "supplement-protocol": { content: supplementProtocolContent, setContent: setSupplementProtocolContent },
    "workout-plan":        { content: workoutContent,            setContent: setWorkoutContent            },
    "sleeping-advices":    { content: sleepContent,              setContent: setSleepContent              },
    "action-plan":         { content: actionPlanContent,         setContent: setActionPlanContent         },
    "posture-analysis":    { content: postureAnalysisContent,    setContent: setPostureAnalysisContent    },
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
  // URLs are pre-fetched server-side — no client-side fetch needed on mount
  const [beforeUrl, setBeforeUrl]   = useState<string | null>(initialBeforeUrl);
  const [afterUrl, setAfterUrl]     = useState<string | null>(initialAfterUrl);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);

  // Listen for protocol-navigate custom events (e.g. from SummaryReport CTA)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      navigateTo(ce.detail as SectionId);
    };
    window.addEventListener("protocol-navigate", handler);
    return () => window.removeEventListener("protocol-navigate", handler);
  }, [navigateTo]);

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
          <nav className="flex-1 p-2.5">
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
                  onClick={() => navigateTo(entry.id)}
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
                      onClick={() => { navigateTo(entry.id); setNavOpen(false); }}
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

          {active === "summary" && metrics ? (
            <SummaryReport
              firstName={firstName}
              age={age}
              deliveredDate={deliveredDate}
              metrics={metrics}
              summary={summary}
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
              weightKg={weightKg}
              isAdmin={isAdmin}
              generating={generating}
              genError={genError}
              genSummary={genSummary}
              summaryError={summaryError}
              onGenerate={handleGenerate}
              onGenerateSummary={handleGenerateSummary}
              userId={userId}
              photoFront={photoFront}
              onRegenerate={handleGenerate}
            />
          ) : active === "summary" ? (
            <div className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:px-8 lg:px-10 lg:py-10">
              <EmptyState message="No metrics available. Calibrate first." />
            </div>
          ) : active === "body-analysis" && metrics ? (
            <BodyAnalysis
              firstName={firstName}
              age={age}
              deliveredDate={deliveredDate}
              metrics={metrics}
              points={points}
              photoFront={photoFront}
              photoSide={photoSide}
              heightCm={heightCm}
            />
          ) : active === "body-analysis" ? (
            <div className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:px-8 lg:px-10 lg:py-10">
              <EmptyState message="No body metrics available." />
            </div>
          ) : (
          <ReportSectionPage
            firstName={firstName}
            sectionLabel={SECTION_LABELS[active]}
            categoryLabel={LIFESTYLE_IDS.has(active) ? "Lifestyle" : "Protocol"}
            email={isAdmin ? email : undefined}
          >
            {active === "action-plan" && (
              <GeneratedSection
                sectionKey="action-plan"
                userId={userId}
                label="Action Plan"
                description={`Synthesizes the nutrition, workout, and sleep protocol into a prioritized transformation roadmap for ${firstName}.`}
                content={sectionStateMap["action-plan"].content}
                onContent={sectionStateMap["action-plan"].setContent}
                warningWhenEmpty={
                  !nutritionContent || !workoutContent || !sleepContent
                    ? "For best results, generate all other sections first."
                    : undefined
                }
              />
            )}
            {active === "nutrition-plan" && (
              <GeneratedSection
                sectionKey="nutrition-plan"
                userId={userId}
                label="Nutrition Plan"
                description={`Personalized caloric targets, macros, food choices, and a 90-day meal plan for ${firstName}.`}
                content={sectionStateMap["nutrition-plan"].content}
                onContent={sectionStateMap["nutrition-plan"].setContent}
                renderContent={renderNutritionContent}
              />
            )}
            {active === "supplement-protocol" && (
              <GeneratedSection
                sectionKey="supplement-protocol"
                userId={userId}
                label="Supplement Protocol"
                description={`Evidence-based supplement stack for ${firstName} — current assessment, recommended stack, and a full timing & dosing protocol.`}
                content={sectionStateMap["supplement-protocol"].content}
                onContent={sectionStateMap["supplement-protocol"].setContent}
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
              <>
                {(photoFront || photoSide) && metrics && (
                  <PosturePhotosPanel
                    photoFront={photoFront}
                    photoSide={photoSide}
                    pas={metrics.pas}
                    points={points}
                  />
                )}
                <GeneratedSection
                  sectionKey="posture-analysis"
                  userId={userId}
                  label="Posture Analysis"
                  description={`A personalized posture assessment and correction protocol for ${firstName} — alignment analysis, root causes, and a 12-week correction plan.`}
                  content={sectionStateMap["posture-analysis"].content}
                  onContent={sectionStateMap["posture-analysis"].setContent}
                />
              </>
            )}
          </ReportSectionPage>
          )}
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

// ── Report section page layout ───────────────────────────────────────────────

function ReportSectionPage({
  firstName,
  sectionLabel,
  categoryLabel,
  email,
  children,
}: {
  firstName:     string;
  sectionLabel:  string;
  categoryLabel: string;
  email?:        string;
  children:      React.ReactNode;
}) {
  const [word1, ...rest] = sectionLabel.split(" ");
  const word2 = rest.join(" ");

  const fontD = '"Iowan Old Style","Palatino Linotype","Book Antiqua",Georgia,serif';
  const fontM = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';
  const fontS = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';

  return (
    <div style={{ background: "#f9fbfb", fontFamily: fontS, color: "#253239", minHeight: "100vh", overflowX: "hidden" }}>
      <style suppressHydrationWarning>{`
        .rsp-topbar  { display:flex; align-items:center; justify-content:space-between; padding:20px 56px; border-bottom:1px solid #edf0f1; background:#fff; }
        .rsp-content { max-width:1100px; margin:0 auto; padding:40px 56px 96px; }
        .rsp-hero    { padding-bottom:44px; margin-bottom:36px; border-bottom:1px solid #edf0f1; }
        .rsp-h1      { font-family:${fontD}; font-size:clamp(44px,6vw,72px); font-weight:400; line-height:1.08; letter-spacing:-0.03em; margin:0; color:#253239; }
        .rsp-article { background:#fff; border:1px solid #edf0f1; border-radius:20px; padding:48px 56px; }
        @media (max-width:768px) {
          .rsp-topbar  { display:none; }
          .rsp-content { padding:24px 16px; padding-bottom:calc(80px + max(12px,env(safe-area-inset-bottom))); }
          .rsp-hero    { padding-bottom:24px; margin-bottom:24px; }
          .rsp-h1      { font-size:clamp(32px,8vw,52px) !important; }
          .rsp-article { padding:24px 20px; border-radius:16px; }
        }
      `}</style>

      {/* Top bar — hidden on mobile (ProtocolSidebarLayout owns the mobile header) */}
      <div className="rsp-topbar">
        <div style={{ fontFamily: fontM, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#799097" }}>
          Protocol
          <span style={{ color: "#9eb1b8", margin: "0 8px" }}>/</span>
          {firstName}
          <span style={{ color: "#9eb1b8", margin: "0 8px" }}>/</span>
          <span style={{ color: "#253239" }}>{sectionLabel}</span>
        </div>
      </div>

      <div className="rsp-content">
        {/* Hero */}
        <div className="rsp-hero">
          <div style={{ fontFamily: fontS, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#799097", marginBottom: 14 }}>
            Protocol · {categoryLabel}
          </div>
          <h1 className="rsp-h1">
            {word1}
            {word2 && (
              <><br /><em style={{ fontStyle: "italic", color: "#9eb1b8" }}>{word2}.</em></>
            )}
          </h1>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// ── Food Choices card renderer ───────────────────────────────────────────────

const FOOD_CATEGORY_ICONS: Record<string, string> = {
  "Proteins":      "🥩",
  "Carbohydrates": "🌾",
  "Fats":          "🫒",
  "Vegetables":    "🥦",
};

function parseFoodCategories(content: string): Array<{ name: string; prioritize: string[]; limit: string[] }> {
  const results: Array<{ name: string; prioritize: string[]; limit: string[] }> = [];
  const re = /### ([^\n]+)\n\*\*Prioritize:\*\* ([^\n]+)\n\*\*Limit:\*\* ([^\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    results.push({
      name:       m[1].trim(),
      prioritize: m[2].split(",").map(s => s.trim()).filter(Boolean),
      limit:      m[3].split(",").map(s => s.trim()).filter(Boolean),
    });
  }
  return results;
}

function FoodChoicesCards({ content }: { content: string }) {
  const categories = parseFoodCategories(content);

  if (categories.length === 0) {
    return (
      <div className={PROSE_CLASSES}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  const fontS = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';
  const fontM = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';

  return (
    <div>
      <h2 style={{ fontFamily: fontS, fontSize: 17, fontWeight: 600, color: "#253239", marginTop: 40, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #edf0f1" }}>
        Food Choices
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
        {categories.map(cat => (
          <div key={cat.name} style={{ border: "1px solid #edf0f1", borderRadius: 16, padding: "20px 22px", background: "#fff" }}>
            <div style={{ fontFamily: fontS, fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "#799097", marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 16 }}>{FOOD_CATEGORY_ICONS[cat.name] ?? "●"}</span>
              <span>{cat.name}</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: fontM, fontSize: 9, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#4a7c59", marginBottom: 7 }}>
                Prioritize
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: 4 }}>
                {cat.prioritize.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 13, color: "#253239", lineHeight: 1.55 }}>
                    <span style={{ color: "#4a7c59", flexShrink: 0, fontWeight: 600, marginTop: 1 }}>+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ fontFamily: fontM, fontSize: 9, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#8a5c30", marginBottom: 7 }}>
                Limit
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" as const, gap: 4 }}>
                {cat.limit.map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 13, color: "#253239", lineHeight: 1.55 }}>
                    <span style={{ color: "#8a5c30", flexShrink: 0, fontWeight: 600, marginTop: 1 }}>—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderNutritionContent(content: string): React.ReactNode {
  // Split at ## section headers, keeping the delimiter with its content
  const sections = content.split(/(?=^## )/m).filter(s => s.trim());
  return (
    <>
      {sections.map((section, i) => {
        if (/^## Food Choices/i.test(section.trim())) {
          return <FoodChoicesCards key={i} content={section} />;
        }
        return (
          <div key={i} className={PROSE_CLASSES}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{section}</ReactMarkdown>
          </div>
        );
      })}
    </>
  );
}

// ── Posture photos panel ─────────────────────────────────────────────────────

function PosturePhotosPanel({
  photoFront,
  photoSide,
  pas,
  points,
}: {
  photoFront: string | null;
  photoSide:  string | null;
  pas:        number;
  points:     OverlayPoints | null;
}) {
  if (!photoFront && !photoSide) return null;

  const fontM = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';
  const fontS = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';

  const pasLabel = pas >= 90 ? "Excellent" : pas >= 80 ? "Good" : pas >= 70 ? "Fair" : "Poor";
  const pasColor = pas >= 90 ? "#4a7c59" : pas >= 80 ? "#4a6c7c" : pas >= 70 ? "#8a7c30" : "#8a4c30";
  const pasBg    = pas >= 90 ? "rgba(74,124,89,0.1)" : pas >= 80 ? "rgba(74,108,124,0.1)" : pas >= 70 ? "rgba(138,124,48,0.1)" : "rgba(138,76,48,0.1)";

  return (
    <div style={{ background: "#fff", border: "1px solid #edf0f1", borderRadius: 20, padding: "32px 40px", marginBottom: 24 }}>
      <style suppressHydrationWarning>{`
        @media (max-width: 640px) {
          .posture-photos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, marginBottom: 24, borderBottom: "1px solid #edf0f1" }}>
        <div style={{ fontFamily: fontM, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#799097" }}>
          Reference Photos{points ? " · calibrated" : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: pasBg, borderRadius: 100, padding: "6px 16px" }}>
          <span style={{ fontFamily: fontM, fontSize: 9, fontWeight: 700, color: pasColor, textTransform: "uppercase" as const, letterSpacing: "0.12em" }}>PAS</span>
          <span style={{ fontFamily: fontS, fontSize: 22, fontWeight: 700, color: pasColor, lineHeight: 1 }}>{pas}</span>
          <span style={{ fontFamily: fontS, fontSize: 12, color: pasColor, fontWeight: 500 }}>{pasLabel}</span>
        </div>
      </div>

      {/* Photos grid — lateral first (most relevant for PAS) */}
      <div className="posture-photos-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {photoSide && (
          <div>
            <p style={{ fontFamily: fontM, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "#799097", marginBottom: 10 }}>
              Lateral view · alignment reference
            </p>
            {/* Scan container — same style as BodyAnalysis ba-scan */}
            <div style={{ position: "relative", aspectRatio: "3/4", background: "#1a1410", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(37,50,57,0.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSide} alt="Lateral view" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />

              {/* Calibration overlay — posture alignment lines */}
              {points && (() => {
                const { postureTop: pt, postureBottom: pb } = points;
                const midX = (pt.x + pb.x) / 2;
                const midY = (pt.y + pb.y) / 2;
                return (
                  <svg
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* Vertical reference (plumb line) */}
                    <line
                      x1={midX} y1={pt.y} x2={midX} y2={pb.y}
                      stroke={OC.posture.faint} strokeWidth="0.4" strokeDasharray="2 2"
                    />
                    {/* Actual posture axis */}
                    <line
                      x1={pt.x} y1={pt.y} x2={pb.x} y2={pb.y}
                      stroke={OC.posture.line} strokeWidth="0.6" strokeDasharray="2 1.5"
                    />
                    {/* Anchor points */}
                    <circle cx={pt.x} cy={pt.y} r={1.4} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.5"/>
                    <circle cx={pb.x} cy={pb.y} r={1.4} fill={OC.posture.faint} stroke={OC.posture.line} strokeWidth="0.5"/>
                    {/* Labels */}
                    <text x={pt.x + 2.5} y={pt.y + 1.2} fontSize="2.3" fill={OC.posture.line} fontWeight="600" letterSpacing="0.1" style={{ fontFamily: "monospace" }}>EAR</text>
                    <text x={pb.x + 2.5} y={pb.y - 0.8} fontSize="2.3" fill={OC.posture.line} fontWeight="600" letterSpacing="0.1" style={{ fontFamily: "monospace" }}>ANKLE</text>
                    {/* Score badge at midpoint */}
                    <text x={midX + 2.5} y={midY + 1} fontSize="2.5" fill={OC.posture.line} fontWeight="700" letterSpacing="0.15" style={{ fontFamily: "monospace" }}>PAS {pas}</text>
                  </svg>
                );
              })()}
            </div>
          </div>
        )}
        {photoFront && (
          <div>
            <p style={{ fontFamily: fontM, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "#799097", marginBottom: 10 }}>
              Front view · symmetry reference
            </p>
            <div style={{ position: "relative", aspectRatio: "3/4", background: "#1a1410", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(37,50,57,0.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoFront} alt="Front view" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
            </div>
          </div>
        )}
      </div>
    </div>
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
  renderContent,
}: {
  sectionKey:       string;
  userId:           string;
  label:            string;
  description:      string;
  content:          string | null;
  onContent:        (v: string | null) => void;
  warningWhenEmpty?: string;
  renderContent?:   (content: string) => React.ReactNode;
}) {
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [content,     setLocalContent] = useState<string | null>(initialContent);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editDraft,   setEditDraft]   = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  const fontM = '"JetBrains Mono","SF Mono",ui-monospace,Menlo,monospace';
  const fontS = '"Avenir Next","Helvetica Neue","Segoe UI",system-ui,sans-serif';

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

  const startEdit = () => {
    setEditDraft(content ?? "");
    setPreviewMode(false);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/save-section", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, section: sectionKey, content: editDraft }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setSaveError(data.error ?? "Save failed.");
      } else {
        setLocalContent(editDraft);
        onContent(editDraft);
        setIsEditing(false);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unknown error.");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <article className="rsp-article">
        <style suppressHydrationWarning>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {/* Editor toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, marginBottom: 24, borderBottom: "1px solid #edf0f1", flexWrap: "wrap", gap: 12 }}>
          {/* Source / Preview tabs */}
          <div style={{ display: "flex", gap: 3, background: "#f4f6f7", borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setPreviewMode(false)}
              style={{
                fontFamily: fontM, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em",
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: !previewMode ? "#fff" : "transparent",
                color: !previewMode ? "#253239" : "#799097",
                boxShadow: !previewMode ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
                transition: "all 0.15s",
              }}
            >
              Markdown
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              style={{
                fontFamily: fontM, fontSize: 10, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em",
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: previewMode ? "#fff" : "transparent",
                color: previewMode ? "#253239" : "#799097",
                boxShadow: previewMode ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
                transition: "all 0.15s",
              }}
            >
              Preview
            </button>
          </div>

          {/* Cancel / Save */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsEditing(false)}
              style={{ fontFamily: fontS, fontSize: 12, fontWeight: 500, color: "#7f949b", background: "none", border: "1px solid #dde3e5", borderRadius: 7, padding: "7px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: fontS, fontSize: 12, fontWeight: 600, color: "#fff", background: saving ? "#799097" : "#253239", border: "none", borderRadius: 7, padding: "7px 18px", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving
                ? <><span style={{ display: "inline-block", width: 10, height: 10, border: "1.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</>
                : "Save"
              }
            </button>
          </div>
        </div>

        {previewMode ? (
          renderContent ? renderContent(editDraft) : (
            <div className={PROSE_CLASSES}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{editDraft}</ReactMarkdown>
            </div>
          )
        ) : (
          <textarea
            value={editDraft}
            onChange={e => setEditDraft(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: "65vh",
              fontFamily: fontM,
              fontSize: 13,
              lineHeight: 1.7,
              color: "#253239",
              background: "#f9fbfb",
              border: "1px solid #e4e9eb",
              borderRadius: 12,
              padding: "20px 24px",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}

        {saveError && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{saveError}</p>}
      </article>
    );
  }

  // ── Content exists ─────────────────────────────────────────────────────────
  if (content) {
    return (
      <article className="rsp-article">
        <style suppressHydrationWarning>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, marginBottom: 32, borderBottom: "1px solid #edf0f1" }}>
          <div style={{ fontFamily: fontS, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "#799097" }}>
            {label}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={startEdit}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: "#7f949b", fontSize: 11, fontFamily: fontM, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}
            >
              ✎ Edit
            </button>
            <span style={{ width: 1, height: 12, background: "#dde3e5" }} />
            <button
              onClick={generate}
              disabled={generating}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: generating ? "not-allowed" : "pointer", color: "#7f949b", fontSize: 11, fontFamily: fontM, textTransform: "uppercase" as const, letterSpacing: "0.08em", opacity: generating ? 0.5 : 1 }}
            >
              {generating
                ? <><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Regenerating…</>
                : "↻ Regenerate"
              }
            </button>
          </div>
        </div>
        {renderContent ? renderContent(content) : (
          <div className={PROSE_CLASSES}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
        {error && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{error}</p>}
      </article>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#fff", border: "1px solid #edf0f1", borderRadius: 20, padding: "48px 56px" }}>
      <style suppressHydrationWarning>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ marginBottom: 8, fontSize: 15, fontWeight: 600, color: "#253239" }}>Generate {label}</p>
      <p style={{ marginBottom: 24, fontSize: 14, color: "#7f949b", lineHeight: 1.6, maxWidth: 520 }}>{description}</p>
      {warningWhenEmpty && (
        <p style={{ marginBottom: 20, fontSize: 12, color: "#8a5c30", background: "rgba(138,92,48,0.08)", borderRadius: 8, padding: "10px 14px" }}>
          {warningWhenEmpty}
        </p>
      )}
      <button
        onClick={generate}
        disabled={generating}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#253239", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1 }}
      >
        {generating
          ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Generating…</>
          : `Generate ${label}`
        }
      </button>
      {error && <p style={{ marginTop: 12, fontSize: 12, color: "#9a4040" }}>{error}</p>}
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
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    setPosition(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)));
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updatePosition(e.clientX);
  };

  const containerStyle: React.CSSProperties = fullscreen
    ? { flex: 1, minHeight: 0, cursor: "ew-resize", touchAction: "none", userSelect: "none" }
    : { aspectRatio: "3/4", cursor: "ew-resize", touchAction: "none", userSelect: "none" };

  return (
    <div className={fullscreen ? "flex flex-col h-full" : ""}>
      {/* Labels */}
      <div className="mb-2 flex justify-between shrink-0">
        <span className="rounded bg-[#f0f0ef] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#888]">Before</span>
        <div className="flex items-center gap-2">
          {!fullscreen && (
            <button onClick={() => onExpand(beforeSrc, "")} className="text-[10px] text-mute underline-offset-2 hover:underline">
              expand
            </button>
          )}
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">After</span>
        </div>
      </div>

      {/* Slider container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl"
        style={containerStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={e => e.currentTarget.releasePointerCapture(e.pointerId)}
        onPointerCancel={e => e.currentTarget.releasePointerCapture(e.pointerId)}
      >
        {/* Before */}
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${beforeSrc})`, backgroundSize: "cover", backgroundPosition: "top center" }}
        />

        {/* After — revealed from left edge to divider */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${afterSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "top center",
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
        />

        {/* Divider line */}
        <div
          className="absolute inset-y-0 w-px bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)] pointer-events-none"
          style={{ left: `${position}%` }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M5 1L1 6l4 5M13 1l4 5-4 5" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Slide hint */}
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

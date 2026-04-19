import React from "react";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "./pdfFonts";
import { CoverPage } from "./sections/CoverPage";
import { TocPage } from "./sections/TocPage";
import { SectionTitlePage, SectionPage } from "./sections/SectionPage";
import { MetricsGrid } from "./sections/MetricsGrid";
import { ProseSection } from "./sections/ProseSection";
import { BeforeAfterSection } from "./sections/BeforeAfterSection";
import type { CalibrationMetrics } from "../admin/orders/[userId]/PhotoCalibrator";
import { computeAttractivenessScore } from "../../lib/attractivenessScore";

type SectionId =
  | "summary"
  | "body-analysis"
  | "nutrition-plan"
  | "workout-plan"
  | "sleeping-advices"
  | "posture-analysis"
  | "supplement-protocol"
  | "action-plan";

const SECTION_META: Record<SectionId, { label: string; category: string }> = {
  "summary":             { label: "Summary Report",      category: "Overview"  },
  "body-analysis":       { label: "Body Analysis",       category: "Body"      },
  "nutrition-plan":      { label: "Nutrition Plan",      category: "Lifestyle" },
  "workout-plan":        { label: "Workout Plan",        category: "Lifestyle" },
  "sleeping-advices":    { label: "Sleeping Advices",    category: "Lifestyle" },
  "posture-analysis":    { label: "Posture Analysis",    category: "Lifestyle" },
  "supplement-protocol": { label: "Supplement Protocol", category: "Lifestyle" },
  "action-plan":         { label: "Action Plan",         category: "Protocol"  },
};

const SECTION_ORDER: SectionId[] = [
  "body-analysis",
  "nutrition-plan",
  "workout-plan",
  "sleeping-advices",
  "posture-analysis",
  "supplement-protocol",
  "action-plan",
];

export type ProtocolPDFProps = {
  firstName:                  string;
  deliveredDate:              string | null;
  photoDataUri:               string | null;
  beforeAfterDataUri:         string | null;
  metrics:                    CalibrationMetrics | null;
  age?:                       number;
  summary:                    string | null;
  nutritionPlanContent:       string | null;
  workoutPlanContent:         string | null;
  sleepingAdvicesContent:     string | null;
  postureAnalysisContent:     string | null;
  supplementProtocolContent:  string | null;
  actionPlanContent:          string | null;
};

export function ProtocolPDF({
  firstName,
  deliveredDate,
  photoDataUri,
  beforeAfterDataUri,
  metrics,
  age,
  summary,
  nutritionPlanContent,
  workoutPlanContent,
  sleepingAdvicesContent,
  postureAnalysisContent,
  supplementProtocolContent,
  actionPlanContent,
}: ProtocolPDFProps) {
  registerFonts();

  const { score, label: scoreLabel } = metrics
    ? computeAttractivenessScore(metrics, age)
    : { score: 0, label: "-" };

  const sectionContents: Record<SectionId, string | null> = {
    "summary":             summary,
    "body-analysis":       metrics ? "__metrics__" : null,
    "nutrition-plan":      nutritionPlanContent,
    "workout-plan":        workoutPlanContent,
    "sleeping-advices":    sleepingAdvicesContent,
    "posture-analysis":    postureAnalysisContent,
    "supplement-protocol": supplementProtocolContent,
    "action-plan":         actionPlanContent,
  };

  const activeSections = SECTION_ORDER.filter(id => sectionContents[id] != null);

  const tocEntries = [
    ...(summary ? [{ label: SECTION_META["summary"].label, category: SECTION_META["summary"].category }] : []),
    ...activeSections.map(id => ({ label: SECTION_META[id].label, category: SECTION_META[id].category })),
  ];

  // Build section index list for numbering
  const allSections: SectionId[] = [
    ...(summary ? ["summary" as SectionId] : []),
    ...activeSections,
  ];

  return (
    <Document
      title={`${firstName} — Protocol`}
      author="Protocol"
      subject="Personal Protocol"
    >
      {/* Page 1 — Cover */}
      <CoverPage
        firstName={firstName}
        deliveredDate={deliveredDate}
        score={score}
        scoreLabel={scoreLabel}
      />

      {/* Page 2 — TOC */}
      {tocEntries.length > 0 && (
        <TocPage entries={tocEntries} firstName={firstName} />
      )}

      {/* Summary */}
      {summary && (() => {
        const idx = allSections.indexOf("summary") + 1;
        const meta = SECTION_META["summary"];
        return (
          <>
            <SectionTitlePage
              sectionLabel={meta.label}
              categoryLabel={meta.category}
              sectionIndex={idx}
            />
            <SectionPage sectionLabel={meta.label} categoryLabel={meta.category} firstName={firstName}>
              <ProseSection content={summary} />
            </SectionPage>
          </>
        );
      })()}

      {/* Body Analysis */}
      {metrics && (() => {
        const idx = allSections.indexOf("body-analysis") + 1;
        const meta = SECTION_META["body-analysis"];
        return (
          <>
            <SectionTitlePage
              sectionLabel={meta.label}
              categoryLabel={meta.category}
              sectionIndex={idx}
            />
            <SectionPage sectionLabel={meta.label} categoryLabel={meta.category} firstName={firstName}>
              <MetricsGrid metrics={metrics} age={age} />
              <BeforeAfterSection
                photoFront={photoDataUri}
                beforeAfterUri={beforeAfterDataUri}
              />
            </SectionPage>
          </>
        );
      })()}

      {/* Prose sections */}
      {activeSections
        .filter(id => id !== "body-analysis")
        .map(id => {
          const content = sectionContents[id];
          if (!content) return null;
          const meta = SECTION_META[id];
          const idx  = allSections.indexOf(id) + 1;
          return (
            <React.Fragment key={id}>
              <SectionTitlePage
                sectionLabel={meta.label}
                categoryLabel={meta.category}
                sectionIndex={idx}
              />
              <SectionPage sectionLabel={meta.label} categoryLabel={meta.category} firstName={firstName}>
                <ProseSection content={content} />
              </SectionPage>
            </React.Fragment>
          );
        })}
    </Document>
  );
}

export async function renderProtocolPDFToBuffer(props: ProtocolPDFProps): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(<ProtocolPDF {...props} /> as any);
}

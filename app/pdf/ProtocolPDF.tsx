import { Document, renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "./pdfFonts";
import { CoverPage } from "./sections/CoverPage";
import { TocPage } from "./sections/TocPage";
import { SectionPage } from "./sections/SectionPage";
import { MetricsGrid } from "./sections/MetricsGrid";
import { ProseSection } from "./sections/ProseSection";
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
  // Register fonts (idempotent — react-pdf caches by family name)
  registerFonts();

  const { score, label: scoreLabel } = metrics
    ? computeAttractivenessScore(metrics, age)
    : { score: 0, label: "—" };

  // Build TOC entries — only sections with content
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

  // Include summary separately at the front of TOC if present
  const tocEntries = [
    ...(summary ? [{ label: SECTION_META["summary"].label, category: SECTION_META["summary"].category }] : []),
    ...activeSections.map(id => ({ label: SECTION_META[id].label, category: SECTION_META[id].category })),
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
        photoDataUri={photoDataUri}
      />

      {/* Page 2 — TOC */}
      {tocEntries.length > 0 && (
        <TocPage entries={tocEntries} firstName={firstName} />
      )}

      {/* Summary */}
      {summary && (
        <SectionPage
          sectionLabel={SECTION_META["summary"].label}
          categoryLabel={SECTION_META["summary"].category}
          firstName={firstName}
        >
          <ProseSection content={summary} />
        </SectionPage>
      )}

      {/* Body Analysis */}
      {metrics && (
        <SectionPage
          sectionLabel={SECTION_META["body-analysis"].label}
          categoryLabel={SECTION_META["body-analysis"].category}
          firstName={firstName}
        >
          <MetricsGrid metrics={metrics} age={age} />
        </SectionPage>
      )}

      {/* Generated prose sections */}
      {activeSections
        .filter(id => id !== "body-analysis")
        .map(id => {
          const content = sectionContents[id];
          if (!content) return null;
          const meta = SECTION_META[id];
          return (
            <SectionPage
              key={id}
              sectionLabel={meta.label}
              categoryLabel={meta.category}
              firstName={firstName}
            >
              <ProseSection content={content} />
            </SectionPage>
          );
        })}
    </Document>
  );
}

/**
 * Renders the protocol PDF to a Buffer.
 * Kept in this file so that JSX compilation and renderToBuffer run in the same
 * webpack module context as @react-pdf/renderer — avoids React instance mismatch.
 */
export async function renderProtocolPDFToBuffer(props: ProtocolPDFProps): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(<ProtocolPDF {...props} /> as any);
}

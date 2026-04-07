import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isVisualizationStep } from "../../../../lib/visualizationFlow";
import VisualizationExperience from "../../../visualization/visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Visualize Your Potential",
  description: "Generate your body visualization first, then answer a short questionnaire before checkout.",
};
export const dynamic = "force-dynamic";

export default function FunnelThreeVisualizationStepPage({ params }: { params: { step: string } }) {
  if (!isVisualizationStep(params.step)) {
    notFound();
  }

  return <VisualizationExperience funnel="v3" step={params.step} />;
}

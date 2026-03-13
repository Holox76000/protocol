import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isVisualizationStep } from "../../../../lib/visualizationFlow";
import VisualizationExperience from "../../../visualization/visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a realistic body transformation preview.",
};

export default function FunnelTwoVisualizationStepPage({ params }: { params: { step: string } }) {
  if (!isVisualizationStep(params.step)) {
    notFound();
  }

  return <VisualizationExperience funnel="f2" step={params.step} />;
}

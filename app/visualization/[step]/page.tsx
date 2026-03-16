import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMainVisualizationScreenConfig, getMainVisualizationScreenHref, isMainVisualizationScreen } from "../../../lib/visualizationFlow";
import VisualizationExperience from "../visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a realistic body transformation preview.",
};

export default function VisualizationStepPage({ params }: { params: { step: string } }) {
  if (!isMainVisualizationScreen(params.step)) {
    notFound();
  }

  if (params.step === "upload") {
    redirect(getMainVisualizationScreenHref("upload-intro"));
  }

  const config = getMainVisualizationScreenConfig(params.step);

  return <VisualizationExperience funnel="main" step={config.step} screenMode={config.mode} />;
}

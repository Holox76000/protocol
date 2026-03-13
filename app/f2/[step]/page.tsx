import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getVisualizationStepHref, isVisualizationStep } from "../../../lib/visualizationFlow";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a realistic body transformation preview.",
};

export default function FunnelTwoStepPage({ params }: { params: { step: string } }) {
  if (!isVisualizationStep(params.step)) {
    notFound();
  }

  redirect(getVisualizationStepHref("f2", params.step));
}

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getVisualizationStepHref, isVisualizationStep } from "../../../lib/visualizationFlow";

export const metadata: Metadata = {
  title: "Protocol | Visualize Your Potential",
  description: "Generate your body visualization first, then answer a short questionnaire before checkout.",
};

export default function FunnelThreeStepPage({ params }: { params: { step: string } }) {
  if (!isVisualizationStep(params.step)) {
    notFound();
  }

  redirect(getVisualizationStepHref("v3", params.step));
}

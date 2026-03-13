import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getVisualizationStepHref } from "../../lib/visualizationFlow";

export const metadata: Metadata = {
  title: "Protocol | Visualize Your Potential",
  description: "Generate your body visualization first, then answer a short questionnaire before checkout.",
};

export default function FunnelThreeEntryPage() {
  redirect(getVisualizationStepHref("v3", "upload"));
}

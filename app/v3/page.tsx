import type { Metadata } from "next";
import VisualizationExperience from "../visualization/visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Visualize Your Potential",
  description: "Generate your body visualization first, then answer a short questionnaire before checkout.",
};

export default function FunnelThreeEntryPage() {
  return <VisualizationExperience funnel="v3" />;
}

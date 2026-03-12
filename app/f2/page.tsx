import type { Metadata } from "next";
import VisualizationExperience from "../visualization/visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a realistic body transformation preview."
};

export default function FunnelTwoEntryPage() {
  return <VisualizationExperience funnel="f2" />;
}


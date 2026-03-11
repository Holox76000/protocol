import type { Metadata } from "next";
import VisualizationExperience from "./visualization-experience";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a muscular body preview with Nanobanana."
};

export default function VisualizationPage() {
  return <VisualizationExperience />;
}

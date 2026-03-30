import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMainVisualizationScreenHref } from "../../lib/visualizationFlow";

export const metadata: Metadata = {
  title: "Protocol | Body Visualizer",
  description: "Upload a photo and generate a realistic body transformation preview."
};

export default function VisualizationPage() {
  redirect(getMainVisualizationScreenHref("upload-intro"));
}

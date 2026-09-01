import type { Metadata } from "next";
import NosePreviewPage from "./NosePreviewPage";

export const metadata: Metadata = {
  title: "NoseLab — See the nose shapes we preview",
  description:
    "Swipe through the nose shapes we can preview on your own photo: hump removed, tip lifted, slimmer bridge, soft slope. Same face, only the nose changes.",
  robots: { index: false },
};

export default function Page() {
  return <NosePreviewPage />;
}

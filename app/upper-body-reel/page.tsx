import type { Metadata } from "next";
import UpperBodyReelExperience from "./upper-body-reel-experience";

export const metadata: Metadata = {
  title: "Protocol | Upper Body Reel",
  description: "HTML, CSS, and JS recreation of the upper body aesthetics video brief.",
};

export default function UpperBodyReelPage() {
  return <UpperBodyReelExperience />;
}

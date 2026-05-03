import type { Metadata } from "next";
import QzShell from "./qz-shell";

export const metadata: Metadata = {
  title: "Attractiveness Diagnostic — Protocol Club",
  description:
    "Clinical assessment based on 3,000+ peer-reviewed studies on male physical attractiveness.",
  robots: { index: false, follow: false },
};

export default function QzPage() {
  return <QzShell />;
}

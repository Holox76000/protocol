import type { Metadata } from "next";
import DemoPage from "./DemoPage";

export const metadata: Metadata = {
  title: "Protocol Dating — Demo",
  description: "Try the Protocol Dating flow: upload a few photos, see the kind of set our AI studio shoots.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DemoPage />;
}

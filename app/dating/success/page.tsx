import type { Metadata } from "next";
import DatingSuccessPage from "./DatingSuccessPage";

export const metadata: Metadata = {
  title: "Protocol Dating — Upload your photos",
  robots: { index: false },
};

export default function Page() {
  return <DatingSuccessPage />;
}

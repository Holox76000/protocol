import type { Metadata } from "next";
import BluffSuccessPage from "./BluffSuccessPage";

export const metadata: Metadata = {
  title: "Bluff AI — You're in",
  robots: { index: false },
};

export default function Page() {
  return <BluffSuccessPage />;
}

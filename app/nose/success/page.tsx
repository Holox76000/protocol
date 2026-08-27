import type { Metadata } from "next";
import NoseSuccessPage from "./NoseSuccessPage";

export const metadata: Metadata = {
  title: "NoseLab — Order confirmed",
  robots: { index: false },
};

export default function Page() {
  return <NoseSuccessPage />;
}

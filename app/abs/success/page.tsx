import type { Metadata } from "next";
import AbsSuccessPage from "./AbsSuccessPage";

export const metadata: Metadata = {
  title: "Protocol Abs — Order confirmed",
  robots: { index: false },
};

export default function Page() {
  return <AbsSuccessPage />;
}

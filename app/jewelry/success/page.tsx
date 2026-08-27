import type { Metadata } from "next";
import JewelrySuccessPage from "./JewelrySuccessPage";

export const metadata: Metadata = {
  title: "GemCheck — Order confirmed",
  robots: { index: false },
};

export default function Page() {
  return <JewelrySuccessPage />;
}

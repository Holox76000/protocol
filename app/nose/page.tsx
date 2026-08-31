import type { Metadata } from "next";
import NoseOfferPage from "./NoseOfferPage";

export const metadata: Metadata = {
  title: "NoseLab — See your nose reshaped before surgery",
  description:
    "Upload one photo. See your nose reshaped — hump removed, tip refined, bridge smoothed — with the rest of your face untouched. Surgeon-ready PDF export. $29 one-time, no subscription.",
};

export default function Page() {
  return <NoseOfferPage />;
}

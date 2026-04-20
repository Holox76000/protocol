import type { Metadata } from "next";
import F1OfferPage from "./f1/offer/F1OfferPage";

export const metadata: Metadata = {
  title: "Protocol Club - Start your body glow up",
  description:
    "AI body analysis of your proportions. A 3-month training protocol built for attractiveness, not muscle size. Ask anything to the experts. $89 one-time.",
};

export default function HomePage() {
  return <F1OfferPage variant="home" />;
}

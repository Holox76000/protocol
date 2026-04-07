import type { Metadata } from "next";
import F1OfferPage from "./F1OfferPage";

export const metadata: Metadata = {
  title: "Attractiveness Protocol — 3-Month Program | Protocol",
  description:
    "AI body analysis of your proportions. A 3-month training protocol built for attractiveness, not muscle size. WhatsApp coaching included. $49 one-time.",
};

export default function F1OfferRoute() {
  return <F1OfferPage />;
}

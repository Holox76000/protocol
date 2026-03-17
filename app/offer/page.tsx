import type { Metadata } from "next";
import OfferPage from "./offer-page";

export const metadata: Metadata = {
  title: "Protocol | Offer",
  description: "Get the full body analysis and transformation plan."
};

export default function OfferRoute() {
  return <OfferPage />;
}

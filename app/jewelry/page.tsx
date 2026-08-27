import type { Metadata } from "next";
import JewelryOfferPage from "./JewelryOfferPage";

export const metadata: Metadata = {
  title: "GemCheck — AI jewelry identifier + value estimate",
  description:
    "Snap a photo of any piece. Get the materials, gemstones, era, hallmarks, and a fair-market value range in minutes. From $4.99/week, cancel anytime.",
};

export default function Page() {
  return <JewelryOfferPage />;
}

import type { Metadata } from "next";
import AbsOfferPage from "./AbsOfferPage";

export const metadata: Metadata = {
  title: "Protocol Abs — AI abs analysis + adaptive plan",
  description:
    "Upload two photos. Get your Abs Score, zone-by-zone breakdown, body-fat estimate, your #1 blocker, and a plan that adapts monthly. $11.99/mo, cancel anytime.",
};

export default function Page() {
  return <AbsOfferPage />;
}

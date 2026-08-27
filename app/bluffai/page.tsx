import type { Metadata } from "next";
import BluffOfferPage from "./BluffOfferPage";

export const metadata: Metadata = {
  title: "Bluff AI — AI prank photo editor",
  description:
    "Pick a style. Upload one photo. Get a result nobody can tell is fake. Fake tattoos, fake couples, bald, aged, and 60+ more templates. From $6.99/week, cancel anytime.",
};

export default function Page() {
  return <BluffOfferPage />;
}

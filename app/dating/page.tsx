import type { Metadata } from "next";
import DatingOfferPage from "./DatingOfferPage";

export const metadata: Metadata = {
  title: "Protocol Dating — AI dating photos that get you matches",
  description:
    "We analyzed thousands of top-performing dating profiles. Upload a few phone photos, get 30 profile-ready shots in 4 styles, delivered in 24 hours. $39.",
};

export default function Page() {
  return <DatingOfferPage />;
}

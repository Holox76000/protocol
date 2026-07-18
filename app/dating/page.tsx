import type { Metadata } from "next";
import DatingOfferPage from "./DatingOfferPage";

export const metadata: Metadata = {
  title: "Protocol Dating — AI dating photos that get you matches",
  description:
    "We analyzed thousands of top-performing dating profiles. Upload a few phone photos, get 30 profile-ready shots in 5 styles, delivered in 24 hours. $39.",
};

export default function Page() {
  return (
    <>
      {/* Hero photos load as CSS backgrounds — preload so LCP doesn't wait on CSSOM */}
      <link rel="preload" as="image" href="/dating/casual.webp" fetchpriority="high" />
      <link rel="preload" as="image" href="/dating/outdoor.webp" fetchpriority="high" />
      <link rel="preload" as="image" href="/dating/night.webp" fetchpriority="high" />
      <link rel="preload" as="image" href="/dating/athletic.webp" fetchpriority="high" />
      <DatingOfferPage />
    </>
  );
}

import type { Metadata } from "next";
import DatingOfferPage from "./DatingOfferPage";

export const metadata: Metadata = {
  title: "Protocol Dating — AI dating photos that get you matches",
  description:
    "We analyzed thousands of top-performing dating profiles. Upload a few phone photos, get 30 profile-ready shots in 6 styles, delivered in 24 hours. $39.",
};

// React 18 only renders the lowercase attribute, but the TS types only accept
// camelCase (which React 18 would drop at runtime) — spread bypasses the check.
const fetchPriorityHigh = { fetchpriority: "high" };

export default function Page() {
  return (
    <>
      {/* Hero photos load as CSS backgrounds — preload so LCP doesn't wait on CSSOM */}
      <link rel="preload" as="image" href="/dating/casual.webp" {...fetchPriorityHigh} />
      <link rel="preload" as="image" href="/dating/outdoor.webp" {...fetchPriorityHigh} />
      <link rel="preload" as="image" href="/dating/night.webp" {...fetchPriorityHigh} />
      <link rel="preload" as="image" href="/dating/athletic.webp" {...fetchPriorityHigh} />
      <DatingOfferPage />
    </>
  );
}

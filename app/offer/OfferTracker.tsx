"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../lib/ga4Event";

export default function OfferTracker() {
  useEffect(() => {
    trackGa4Event("view_offer", {
      funnel: "main",
      offer_variant: "main",
      page_path: "/offer",
    });
  }, []);
  return null;
}

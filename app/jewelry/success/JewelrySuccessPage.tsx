"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../../dating/dating.css";
import "../jewelry.css";

export default function JewelrySuccessPage() {
  useEffect(() => {
    trackGa4Event("jewelry_success_viewed", { funnel: "jewelry", page_path: "/jewelry/success" });
  }, []);

  return (
    <div className="mo-page">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Gem<em>Check</em></div>
      </nav>
      <main className="dt-success__main">
        <div className="dt-success__card">
          <p className="mo-section-eyebrow">Order confirmed</p>
          <h1 className="dt-success__title">Your appraisal is being prepared.</h1>
          <p className="dt-success__muted">
            You&rsquo;ll get an email shortly with your upload link. Send a clear photo
            of your piece and your full appraisal report — materials, gemstones, era,
            hallmarks, and a fair-market value range — lands in your inbox within 24 hours.
          </p>
          <p className="dt-success__muted">
            Your membership renews automatically. To cancel, reply &ldquo;cancel&rdquo; to
            any email from us — handled the same day. No calls, no forms.
          </p>
        </div>
      </main>
    </div>
  );
}

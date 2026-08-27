"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../../dating/dating.css";
import "../nose.css";

export default function NoseSuccessPage() {
  useEffect(() => {
    trackGa4Event("nose_success_viewed", { funnel: "nose", page_path: "/nose/success" });
  }, []);

  return (
    <div className="mo-page">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Nose<em>Lab</em></div>
      </nav>
      <main className="dt-success__main">
        <div className="dt-success__card">
          <p className="mo-section-eyebrow">Order confirmed</p>
          <h1 className="dt-success__title">Your preview is being rendered.</h1>
          <p className="dt-success__muted">
            You&rsquo;ll get an email shortly with your upload link. Once your profile
            photo is in, your preview is rendered — before/after plus variants, and the
            surgeon-ready PDF — and it lands in your inbox within 24 hours.
          </p>
          <p className="dt-success__muted">
            Your membership renews on your plan&rsquo;s cycle. To cancel, reply
            &ldquo;cancel&rdquo; to any email from us — handled the same day. If the preview
            doesn&rsquo;t help, your first payment is refunded, no questions asked.
          </p>
          <p className="dt-success__muted">
            For visualization only. Not medical advice, not a prediction of surgical results.
          </p>
        </div>
      </main>
    </div>
  );
}

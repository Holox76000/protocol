"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../../dating/dating.css";
import "../abs.css";

export default function AbsSuccessPage() {
  useEffect(() => {
    trackGa4Event("abs_success_viewed", { funnel: "abs", page_path: "/abs/success" });
  }, []);

  return (
    <div className="mo-page">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Protocol <em>Abs</em></div>
      </nav>
      <main className="dt-success__main">
        <div className="dt-success__card">
          <p className="mo-section-eyebrow">Order confirmed</p>
          <h1 className="dt-success__title">Your analysis slot is booked.</h1>
          <p className="dt-success__muted">
            You&rsquo;ll receive an email shortly with your upload link, and your full
            report — Abs Score, zone breakdown, body-fat estimate, blocker, and your
            plan — lands in your inbox within 48 hours.
          </p>
          <p className="dt-success__muted">
            Your membership renews monthly. To cancel, reply &ldquo;cancel&rdquo; to any
            email from us — handled the same day. If the report doesn&rsquo;t help,
            your first month is refunded, no questions asked.
          </p>
        </div>
      </main>
    </div>
  );
}

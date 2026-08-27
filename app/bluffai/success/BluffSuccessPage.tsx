"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import "../../f1/f1.css";
import "../../f1/offer/f1-offer.css";
import "../../dating/dating.css";
import "../bluffai.css";

export default function BluffSuccessPage() {
  useEffect(() => {
    trackGa4Event("bluffai_success_viewed", { funnel: "bluffai", page_path: "/bluffai/success" });
  }, []);

  return (
    <div className="mo-page">
      <nav className="mo-nav">
        <div className="mo-nav__brand">Bluff <em>AI</em></div>
      </nav>
      <main className="dt-success__main">
        <div className="dt-success__card">
          <p className="mo-section-eyebrow">You&rsquo;re in</p>
          <h1 className="dt-success__title">Your free trial has started.</h1>
          <p className="dt-success__muted">
            Check your inbox. We just emailed you an upload link — send us the photo and
            pick a template. Your first result lands back in your inbox within minutes,
            ready to text.
          </p>
          <p className="dt-success__muted">
            Your 3 days are free. Cancel before they&rsquo;re up and you&rsquo;re never
            charged — just reply &ldquo;cancel&rdquo; to any email from us, handled the same
            day. Otherwise your weekly membership begins and you get fresh credits each week.
          </p>
        </div>
      </main>
    </div>
  );
}

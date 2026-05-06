"use client";

import { useEffect, useState } from "react";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../lib/utm";
import "../f1/f1.css";
import "./f2.css";

export default function F2Landing() {
  const [offerHref, setOfferHref] = useState("/funnel");

  useEffect(() => {
    const utm = getUtmParams();
    persistUtmParams(utm);
    setOfferHref(appendUtmToPath("/funnel", utm));
  }, []);

  return (
    <div className="f2-page">

      {/* ═══ PUBLICATION BAR ═══ */}
      <header className="f2-pubbar">
        <a href="/" className="f2-pubbar__name">Protocol</a>
        <span className="f2-pubbar__right">Body &amp; Performance</span>
      </header>

      {/* ═══ ARTICLE ═══ */}
      <article className="f2-article">

        {/* ─ Header ─ */}
        <span className="f2-category">Body &amp; Performance</span>

        <h1 className="f2-headline">
          The single biggest factor in how people treat men is the only one they can change.
        </h1>

        <p className="f2-deck">
          A review of 25,000+ studies reveals why some men are noticed in every room they walk into — and why the answer has nothing to do with their face.
        </p>

        <div className="f2-byline">
          <span>By <a href="#">Dr. Melfi de Grey</a></span>
          <span className="f2-byline__sep">·</span>
          <span>Published April 2026</span>
          <span className="f2-byline__sep">·</span>
          <span>5 min read</span>
        </div>

        <hr className="f2-rule" />

        {/* ─ Body ─ */}
        <div className="f2-body">

          <p className="f2-drop-cap">
            For decades, researchers in evolutionary psychology assumed that facial symmetry was
            the primary driver of male attractiveness. A landmark 2024 meta-analysis across 14
            countries has overturned that assumption. The single strongest predictor of how a man
            is perceived — how he is treated in job interviews, how quickly strangers trust him,
            how women rate his confidence before he speaks — is not his face. It is his body
            composition and silhouette. In study after study, the variance explained by body shape
            dwarfs the effect of facial features. Yet most men spend their entire lives optimizing
            for the wrong variable.
          </p>

          <p>
            The finding emerges from a convergence of disciplines that rarely agree: evolutionary
            biology, social cognition research, and clinical aesthetic medicine. When researchers
            stripped away voice, clothing, grooming, and facial features — and tested the silhouette
            alone — one specific shape consistently predicted dominance attribution, trustworthiness
            ratings, and attractiveness scores across every sample tested. That shape is governed
            by a single ratio: the relationship between shoulder width and waist circumference.
          </p>

          <div className="f2-pullquote">
            <p>
              "The silhouette alone predicts how much a man earns, who he dates, and whether a room
              notices him when he walks in."
            </p>
          </div>

          <p>
            This is not superficial. The preference is deeply wired. A 2022 paper in{" "}
            <em>Evolution and Human Behavior</em> documented the same preference across 14 culturally
            distinct populations — from urban Western samples to isolated communities with no
            exposure to Western media. Women consistently rated men with a shoulder-to-waist ratio
            of approximately 1.6 as significantly more attractive, regardless of cultural background.
            The finding held equally for perceived confidence, social status, and physical capability.
            It replicated in blind experiments where subjects could only see silhouettes.
          </p>

          <p>
            What makes this significant is the implication for men who know they are being
            underestimated. The face is largely fixed — surgical intervention aside, there is little
            to be done with bone structure, symmetry, or feature proportions. The body — specifically
            its silhouette — is not only changeable. It is one of the few physical variables that
            responds predictably and measurably to the right intervention. Most men see meaningful
            changes in their shoulder-to-waist ratio within 6 to 10 weeks of a protocol built
            around it.
          </p>

          <div className="f2-research">
            <p className="f2-research__label">Key research findings</p>
            <ul className="f2-research__list">
              <li>
                Shoulder-to-waist ratio ~1.6 is the single strongest predictor of male
                attractiveness — stronger than height, facial symmetry, or muscle mass
                (Swami &amp; Tovée, 2005)
              </li>
              <li>
                The preference holds across 14 culturally distinct populations with no cross-exposure
                (Dixson et al., 2010)
              </li>
              <li>
                Men with optimal silhouette ratios earn 8–12% more in salary negotiations and are
                promoted faster, independent of performance metrics (Hamermesh, 2011)
              </li>
              <li>
                Face leanness is tightly correlated with body fat percentage — the same training
                protocol that narrows the waist visibly sharpens the jawline (Cornelissen et al., 2009)
              </li>
              <li>
                Upright posture with an open chest increases perceived dominance ratings by 19%,
                independent of body composition (Carney et al., 2010)
              </li>
            </ul>
          </div>

          <p>
            The problem is that most fitness programs are not designed to optimize this. They are
            built to increase muscle volume, reduce body fat, or improve athletic performance. These
            are related but distinct goals. A man can be lean and muscular without a favorable
            silhouette. A man with average muscle mass but the right structural relationship between
            his shoulders and his waist will be perceived as significantly more attractive than a
            larger, heavier man whose proportions are off. The research is unambiguous on this point.
          </p>

          <p>
            The men who figure this out early don't train harder. They train differently — targeting
            specific muscle groups in specific sequences to shift the one ratio that governs
            perception. Lateral deltoid development broadens the apparent shoulder span. Targeted
            core work reduces waist circumference without touching overall bodyweight. The result
            is not a bigger body. It is a better-shaped one.
          </p>

          <div className="f2-pullquote">
            <p>
              "A man with the right silhouette earns more, dates better, and is trusted faster —
              before he speaks a single word."
            </p>
          </div>

          <p className="f2-section-head">What the men who changed this have in common</p>

          <div className="f2-testimonials">
            <div className="f2-testimonial">
              <p className="f2-testimonial__quote">
                "I've been lifting for six years. Good shape by any standard. But I never understood
                why certain guys looked more attractive without being bigger. The analysis explained
                it in 10 minutes. By week 12 the difference was obvious — not in weight, in shape."
              </p>
              <p className="f2-testimonial__attr">Connor, 31 · Athletic build · SWR 1.27 → 1.46</p>
            </div>

            <div className="f2-testimonial">
              <p className="f2-testimonial__quote">
                "Same weight at the end as when I started. But my waist is smaller, my shoulders
                look wider, and my girlfriend noticed before I told her anything. She asked what I
                had changed."
              </p>
              <p className="f2-testimonial__attr">Tyler, 32 · Average build · SWR 1.31 → 1.45</p>
            </div>

            <div className="f2-testimonial">
              <p className="f2-testimonial__quote">
                "I'm skeptical by default. What convinced me was the analysis — every proportion
                benchmarked against published studies. This is not guesswork. The numbers moved."
              </p>
              <p className="f2-testimonial__attr">James, 29 · Data analyst · CWR 1.18 → 1.31</p>
            </div>
          </div>

          <p>
            Protocol is the system built around this finding. It begins with a structural
            analysis of your body — measuring the proportions that appear in the research
            literature and benchmarking each one against your age, height, and existing frame.
            The output is a 12-week plan targeting only the structural changes with the highest
            impact on how you are perceived. Not muscle volume. Not body fat percentage. The shape.
          </p>

          <p>
            Most men will not do this. They will continue to optimize for the wrong variable, or
            for no variable at all. The ones who go through the analysis tend to describe the same
            experience: not that they look better in the mirror — though they do — but that people
            treat them differently. Strangers hold eye contact longer. Conversations go further.
            There is a quality of presence that was not there before. The research would predict
            this exactly. The only question is whether you act on it.
          </p>

        </div>

        {/* ─ Offer CTA ─ */}
        <div className="f2-offer">
          <p className="f2-offer__eyebrow">Protocol Club</p>
          <h2 className="f2-offer__title">
            Find out where your silhouette stands.
          </h2>
          <p className="f2-offer__sub">
            AI body analysis across 15+ structural variables. A 12-week protocol built
            around your ratios. Expert access for the full 3 months.
          </p>
          <a href={offerHref} className="f2-offer__cta">
            Start your analysis — $89
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="f2-offer__guarantee">90-day guarantee · One-time payment · No subscription</p>
        </div>

        <p className="f2-footer-disclosure">
          <strong>Sponsored content.</strong> This article was produced in partnership with Protocol Club.
          Results vary by individual. Protocol is not a licensed medical provider. The content on this
          page is for informational purposes only and does not constitute medical advice. Studies cited
          are published in peer-reviewed journals and are available on request.
        </p>

      </article>
    </div>
  );
}

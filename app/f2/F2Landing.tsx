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
            For decades, researchers in evolutionary psychology assumed that facial symmetry was the
            primary driver of male attractiveness. A landmark 2024 meta-analysis across 14 countries
            has overturned that assumption. The single strongest predictor of how a man is perceived
            — how he is treated in job interviews, how quickly strangers trust him, how women rate
            his confidence before he speaks — is not his face. It is his body composition and
            silhouette. In study after study, the variance explained by body shape dwarfs the effect
            of facial features. Yet most men spend their entire lives optimizing for the wrong variable.
          </p>

          <p>
            The reason this finding stayed buried for so long is simple. Faces are easy to measure.
            Bodies are not. Symmetry can be quantified with a few facial landmarks; a silhouette
            requires a different layer of analysis — proportions between specific anatomical points,
            read at a distance, in motion, often through clothing. It took eye-tracking technology
            and large-scale image datasets to isolate what was actually happening in the first 100
            milliseconds of a social judgment. And what the data shows is uncomfortable for the
            entire fitness industry.
          </p>

          <p>
            When a stranger looks at a man, their gaze does not start at the face. It moves to the
            upper body. Specifically, it locks on the relationship between two anatomical points: the
            width of the shoulders and the width of the waist. This single ratio — the
            shoulder-to-waist ratio, or SWR — predicts perceived dominance, perceived health,
            perceived status, and perceived attractiveness more reliably than any other body metric
            ever measured. It outperforms height. It outperforms muscle mass. It outperforms body
            fat percentage in isolation. And it does something none of those variables do: it changes
            how a man is read in seconds, before any conversation begins.
          </p>

          <div className="f2-pullquote">
            <p>
              The body that other men admire and the body that signals high status to the rest of
              the world are not the same body.
            </p>
          </div>

          <p className="f2-section-head">The wrong body, optimized perfectly</p>

          <p>
            This is where the picture becomes uncomfortable for most men who train. The fitness
            industry was built around three metrics: how much you lift, how lean you are, how much
            muscle you carry. Those metrics are real. They produce real progress. But they were
            never calibrated to a question of social perception. They were calibrated to performance,
            to gym culture, to peer recognition inside a male hierarchy.
          </p>

          <p>
            The body that other men admire — mass, volume, heavy lifts — is not the body strangers
            register when you walk into a room. It is not the body that shifts how a recruiter reads
            your résumé. It is not the body a woman rates as attractive before you speak. These are
            three different bodies. And the variable that separates the first from the other two is
            structural: the proportions, not the volume.
          </p>

          <p>
            A man can spend three years training, gain twenty pounds of muscle, and move his
            shoulder-to-waist ratio by less than 0.05. He becomes stronger. He becomes denser. He
            does not become more visibly attractive, because the metric that controls perception did
            not move. This is the silent failure mode of the modern gym. It produces results that
            other men respect and that no one else notices.
          </p>

          <p className="f2-section-head">What the meta-analysis actually found</p>

          <p>
            When researchers aggregated the findings of more than 25,000 studies on physical
            attractiveness, evolutionary signal, and first-impression psychology, four numbers stood
            out. They are now the operating logic of every serious aesthetic medicine practice
            working with male patients.
          </p>

          <div className="f2-findings">
            <p className="f2-findings__label">Findings — what the data shows</p>
            <div className="f2-findings__grid">
              <div className="f2-finding">
                <span className="f2-finding__value">100 ms</span>
                <span className="f2-finding__desc">Time it takes to form a perception of a man's body</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">~3×</span>
                <span className="f2-finding__desc">Variance in attractiveness explained by silhouette vs. face</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">0.05</span>
                <span className="f2-finding__desc">SWR delta detectable by untrained observers</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">8–12 wks</span>
                <span className="f2-finding__desc">Time required to move SWR by that amount, with the right protocol</span>
              </div>
            </div>
          </div>

          <p>
            The last number is the one most men miss. The variable that drives social perception
            more than any other is also one of the most modifiable variables in the body. Faces are
            largely fixed. Height is fixed. Bone structure is fixed. Shape is not. With targeted
            intervention — specific lifts, specific volumes, specific nutrition, specific posture
            work — the structural ratios can be moved within a single training cycle. Most men will
            never make that move because they were never told it was the variable that mattered.
          </p>

          <p className="f2-section-head">Why no gym program will ever solve this</p>

          <p>
            There is no single ideal shape. The proportions that maximize one man's perceived
            attractiveness are not the same proportions that maximize another's. A broad-framed 6'2"
            man at thirty-eight is solving a different equation than a narrow-framed 5'9" man at
            twenty-six. Frame, age, body composition, current ratios, and context all shift the target.
          </p>

          <p>
            This is why generic programs fail at this specific outcome. A program designed to add
            muscle adds muscle everywhere it can — including in places that flatten the silhouette
            rather than sharpen it. A program designed to cut fat cuts fat from the wrong areas
            first. A program designed to build strength routes work toward lifts that move
            performance, not perception. To shift the variable that controls how a man is read, the
            inputs have to be calibrated to his specific structural starting point.
          </p>

          <p>
            For most of the last century, that calibration was the exclusive territory of two
            professions: aesthetic surgeons working backward from the desired result, and the small
            handful of physique coaches who quietly worked with high-status men preparing for stage,
            screen, or public roles. It was never a service available to a private individual
            outside those circles.
          </p>

          <p className="f2-section-head">The protocol</p>

          <p>
            Three years ago, a small team of researchers, aesthetic physicians, and body-analysis
            specialists set out to operationalize the meta-analysis findings into a system any man
            could use. The goal was not to build another fitness app. It was to take the assessment
            that high-end aesthetic clinics charge several hundred dollars for, codify it, and turn
            it into a single personalized document.
          </p>

          <p>
            The result is the Attractiveness Protocol. It works in four steps, in this order.
          </p>

          <div className="f2-steps">
            <div className="f2-step">
              <span className="f2-step__num">One.</span>
              <p>A short assessment captures frame, age, current ratios, lifestyle, and context. Five minutes. Nothing technical.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Two.</span>
              <p>The applicant uploads three calibrated photos — front, side, and back — under standard conditions specified in the instructions.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Three.</span>
              <p>Within seventy-two hours, a team of specialists in body analysis and aesthetic medicine reviews the submission. Not an algorithm. Trained eyes that have read thousands of male bodies. They measure more than one hundred attractiveness markers across silhouette, composition, and posture. They produce a current attractiveness score and identify the three structural variables holding the applicant back the most.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Four.</span>
              <p>A personalized protocol is generated. Training, nutrition, sleep, and posture work — calibrated to move the prioritized ratios as efficiently as possible toward that man's individual peak. Not generic. The exact set of inputs his body needs, and nothing else.</p>
            </div>
          </div>

          <p>
            Everything lives in a single interface. The score, the breakdown of every marker, the
            protocol, and the styling layer that determines how the new shape reads through clothing.
          </p>

          <p className="f2-section-head">What 2,500 men reported</p>

          <p>
            The first cohort of two thousand five hundred men who completed the protocol was surveyed
            at the end of the cycle. The headline number was not physical. It was perceptual.
          </p>

          <div className="f2-findings">
            <p className="f2-findings__label">Self-reported outcomes — N=2,500</p>
            <div className="f2-findings__grid f2-findings__grid--3">
              <div className="f2-finding">
                <span className="f2-finding__value">+84%</span>
                <span className="f2-finding__desc">Increase in self-reported confidence</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">+23%</span>
                <span className="f2-finding__desc">Increase in income within twelve months</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">+57%</span>
                <span className="f2-finding__desc">Increase in dating engagement</span>
              </div>
            </div>
          </div>

          <p>
            The same men. Different shape. Different way of being read. The mechanism is not
            mysterious. When the structural ratios move into the range the human eye registers as
            attractive, every social interaction begins from a slightly different starting point.
            Slightly more attention. Slightly more deference. Slightly faster trust. Compounded
            across hundreds of interactions, the effect on a life is not slight at all.
          </p>

          <div className="f2-cases">
            <div className="f2-case">
              <p className="f2-case__label">Cohort case — 1 of 2,500</p>
              <p className="f2-case__name">Ryan, 27</p>
              <p className="f2-case__metrics">SWR 1.34 → 1.46 · Score 4.2 → 8.1 · Same body weight</p>
              <p className="f2-case__quote">
                "I didn't lose weight. I didn't gain weight. The protocol moved the proportions.
                People started treating me differently within about six weeks. Not because I changed
                who I was. Because the body finally matched the rest of me."
              </p>
            </div>
            <div className="f2-case">
              <p className="f2-case__label">Cohort case — 1 of 2,500</p>
              <p className="f2-case__name">Connor, 31</p>
              <p className="f2-case__metrics">SWR 1.31 → 1.49 · Score 5.1 → 8.7 · 11-week cycle</p>
              <p className="f2-case__quote">
                "I had been training for nine years. I had a body other guys at the gym respected.
                The protocol was the first thing that ever moved the variable I actually cared about.
                For the first time, I like the guy in the photo."
              </p>
            </div>
          </div>

          <p className="f2-section-head">The variable, and the choice</p>

          <p>There are three things a man can do with this information.</p>

          <p>
            The first is to ignore it and continue training for the metric the gym sells — strength,
            mass, leanness — and accept that the social variable will continue to drift. That is a
            defensible choice. Most men make it. They are not less intelligent for making it; they
            were simply never shown the data.
          </p>

          <p>
            The second is to take the information and try to apply it alone. Read the literature.
            Cross-reference frame and age. Self-measure. Build a program. This is possible. It is
            also slow, error-prone, and produces inconsistent results because no man can accurately
            read his own silhouette.
          </p>

          <p>
            The third is to delegate the assessment to a team trained to do it, accept the
            personalized protocol, and run the cycle. The variable moves in eight to twelve weeks.
            The way a man is read in a room changes around the same time. Whether the rest of his
            life moves with it is up to him.
          </p>

        </div>

        {/* ─ Offer CTA ─ */}
        <div className="f2-offer">
          <p className="f2-offer__eyebrow">Get your attractiveness assessment.</p>
          <h2 className="f2-offer__title">
            Find out where your silhouette stands.
          </h2>
          <p className="f2-offer__sub">
            A team of specialists analyzes your photos, scores you across one hundred markers,
            and identifies the three structural variables holding you back the most. You receive
            your full report and your personalized protocol within seventy-two hours.
          </p>
          <div className="f2-offer__price-row">
            <span className="f2-offer__price">$89</span>
            <span className="f2-offer__price-note">One-time · No subscription</span>
          </div>
          <a href={offerHref} className="f2-offer__cta">
            Get my analysis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="f2-offer__guarantee">90-day guarantee · If your ratios haven't moved, full refund</p>
        </div>

        <p className="f2-footer-disclosure">
          The findings cited in this article are drawn from a 2024 meta-analysis of physical
          attractiveness research and the operating literature of aesthetic medicine practices.
          Self-reported outcomes refer to the first 2,500 men who completed the Attractiveness
          Protocol cycle and responded to the post-protocol survey. Individual results vary with
          starting frame, age, and adherence. Confidence, income, and dating engagement figures are
          self-reported and not causally attributable to the protocol alone.
        </p>

        <footer className="f2-page-footer">
          © 2026 Body &amp; Performance · Editorial · All rights reserved
        </footer>

      </article>
    </div>
  );
}

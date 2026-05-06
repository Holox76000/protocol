"use client";

import { useEffect, useState } from "react";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../lib/utm";
import "../f1/f1.css";
import "./f2.css";

export default function F2Landing() {
  const [offerHref, setOfferHref] = useState("/f1/offer");

  useEffect(() => {
    const utm = getUtmParams();
    persistUtmParams(utm);
    setOfferHref(appendUtmToPath("/f1/offer", utm));
  }, []);

  return (
    <div className="f2-page">

      {/* ═══ PUBLICATION BAR ═══ */}
      <header className="f2-pubbar">
        <a href="/" className="f2-pubbar__name">Protocol</a>
        <span className="f2-pubbar__right">Body &amp; Performance</span>
      </header>

      {/* ═══ ARTICLE NAV ═══ */}
      <nav className="f2-article-nav" aria-label="Article sections">
        <div className="f2-article-nav__inner">
          <span className="f2-article-nav__current">Body &amp; Performance</span>
          <a href="#science" className="f2-article-nav__link">Science</a>
          <a href="#method" className="f2-article-nav__link">Method</a>
          <a href="#cases" className="f2-article-nav__link">Cases</a>
          <a href="#protocol" className="f2-article-nav__link">Protocol</a>
        </div>
      </nav>

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
            Bodies are not. Symmetry can be quantified with a few facial landmarks; a body requires
            a different layer of analysis — the relationships between dozens of anatomical points,
            read at a distance, in motion, often through clothing. It took eye-tracking technology
            and large-scale image datasets to isolate what was actually happening in the first 100
            milliseconds of a social judgment. And what the data shows is uncomfortable for the
            entire fitness industry.
          </p>

          <p>
            When a stranger looks at a man, the brain does not perform a careful audit. It does not
            register weight, or muscle mass, or how much he can lift. It reads shape. The
            architecture of the body — the proportions between the shoulders and the waist, the
            chest and the hips, the upper body and the lower body, the alignment of the frame from
            head to floor, the way mass is distributed across each segment. This bundle of structural
            variables predicts perceived dominance, perceived health, perceived status, and perceived
            attractiveness more reliably than any other physical characteristic ever measured. It
            outperforms height. It outperforms muscle size. It outperforms body fat percentage in
            isolation. And it does something none of those variables do: it changes how a man is
            read in seconds, before any conversation begins.
          </p>

          <div className="f2-pullquote">
            <p>
              The body that other men admire and the body that signals high status to the rest of
              the world are not the same body.
            </p>
          </div>

          {/* ─ Science ─ */}
          <p id="science" className="f2-section-head">The wrong body, optimized perfectly</p>

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
            not muscle mass. It is shape.
          </p>

          <p>
            A man can spend three years training, gain twenty pounds of muscle, and barely move the
            structural proportions that drive perception. He becomes stronger. He becomes denser. He
            does not become more visibly attractive, because the shape did not change. This is the
            silent failure mode of the modern gym. It produces results that other men respect and
            that no one else notices.
          </p>

          <p className="f2-section-head">What the meta-analysis actually found</p>

          <p>
            When researchers aggregated the findings of more than 25,000 studies on physical
            attractiveness, evolutionary signal, and first-impression psychology, three findings
            stood out. They are now the operating logic of every serious aesthetic medicine practice
            working with male patients.
          </p>

          <div className="f2-findings">
            <p className="f2-findings__label">Findings — what the data shows</p>
            <div className="f2-findings__grid f2-findings__grid--3">
              <div className="f2-finding">
                <span className="f2-finding__value">100 ms</span>
                <span className="f2-finding__desc">Time it takes the brain to read a man's body</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">~3×</span>
                <span className="f2-finding__desc">Variance in attractiveness explained by shape vs. face</span>
              </div>
              <div className="f2-finding">
                <span className="f2-finding__value">8–12 wks</span>
                <span className="f2-finding__desc">Time required to visibly shift shape, with the right protocol</span>
              </div>
            </div>
          </div>

          <p>
            The third number is the one most men miss. The variable that drives social perception
            more than any other is also one of the most modifiable variables in the body. Faces are
            largely fixed. Height is fixed. Bone structure is fixed. Shape is not. With targeted
            intervention — specific lifts, specific volumes, specific nutrition, specific posture
            work — the structural proportions can be moved within a single training cycle. Most men
            will never make that move because they were never told it was the variable that mattered.
          </p>

          {/* ─ Method ─ */}
          <p id="method" className="f2-section-head">There is no single ideal shape</p>

          <p>
            This is the part that breaks every generic program ever sold. The proportions that
            maximize one man's perceived attractiveness are not the same proportions that maximize
            another's. A broad-framed 6'2" man at thirty-eight is solving a different equation than
            a narrow-framed 5'9" man at twenty-six. The shape that reads as peak on one frame reads
            as awkward on another.
          </p>

          <p>
            The variables interact. Frame width sets the upper bound on how much shoulder structure
            can be developed without distortion. Age sets the realistic ceiling on body composition.
            Current proportions determine which areas need volume and which areas need to recede.
            Lifestyle determines what is sustainable. Context — the rooms a man actually walks into
            — determines which signals matter most. Move one input, the rest shift.
          </p>

          <p>
            What the research describes is not a target. It is a personalized equation. The shape
            that maximizes a given man's perceived attractiveness is the unique solution to that
            equation. Until recently, no one had built a system to compute it.
          </p>

          {/* ─ Protocol ─ */}
          <p id="protocol" className="f2-section-head">The protocol</p>

          <p>
            Three years ago, a small team of researchers, aesthetic physicians, and body-analysis
            specialists set out to operationalize the meta-analysis findings into a system any man
            could use. The goal was not to build another fitness app. It was to take the assessment
            that high-end aesthetic clinics charge several hundred dollars for, codify it, and turn
            it into a single personalized document. Five years of literature review, more than three
            thousand peer-reviewed studies, and a dataset of two and a half thousand fully measured
            men later, the equation became operational.
          </p>

          <p>The result is the Attractiveness Protocol. It works in four steps, in this order.</p>

          <div className="f2-steps">
            <div className="f2-step">
              <span className="f2-step__num">One.</span>
              <p>A short assessment captures frame, age, current proportions, lifestyle, goals, and context. Five minutes. Nothing technical.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Two.</span>
              <p>The applicant uploads a set of calibrated photos under standard conditions specified in the instructions.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Three.</span>
              <p>Within seventy-two hours, a team of specialists in body analysis and aesthetic medicine reviews the submission. Not an algorithm. Trained eyes that have read thousands of male bodies. They measure more than one hundred attractiveness markers across silhouette, composition, and posture, and they identify where a given man sits relative to his individual peak. The deliverable is a current attractiveness score and a precise breakdown of the structural variables holding him back the most.</p>
            </div>
            <div className="f2-step">
              <span className="f2-step__num">Four.</span>
              <p>A personalized protocol is generated. Training, nutrition, sleep, and posture work — calibrated to move the prioritized proportions as efficiently as possible toward that man's individual peak shape. Not generic. The exact set of inputs his body requires, and nothing else.</p>
            </div>
          </div>

          <p>
            Everything lives in a single interface. The score, the breakdown of every marker, the
            protocol, and the optional styling layer that determines how the new shape reads through
            clothing.
          </p>

          {/* ─ Cases ─ */}
          <p id="cases" className="f2-section-head">What 2,500 men reported</p>

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
            mysterious. When the structural proportions move into the range the human eye registers
            as attractive, every social interaction begins from a slightly different starting point.
            Slightly more attention. Slightly more deference. Slightly faster trust. Compounded
            across hundreds of interactions, the effect on a life is not slight at all.
          </p>

          <div className="f2-cases">
            <div className="f2-case">
              <p className="f2-case__label">Cohort case — 1 of 2,500</p>
              <p className="f2-case__name">Ryan, 27</p>
              <p className="f2-case__metrics">Score 4.2 → 8.1 · Same body weight</p>
              <p className="f2-case__quote">
                "I didn't lose weight. I didn't gain weight. The protocol moved the proportions.
                People started treating me differently within about six weeks. Not because I changed
                who I was. Because the body finally matched the rest of me."
              </p>
            </div>
            <div className="f2-case">
              <p className="f2-case__label">Cohort case — 1 of 2,500</p>
              <p className="f2-case__name">Connor, 31</p>
              <p className="f2-case__metrics">Score 5.1 → 8.7 · 11-week cycle</p>
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
            read his own shape.
          </p>

          <p>
            The third is to delegate the assessment to a team trained to do it, accept the
            personalized protocol, and run the cycle. The shape moves in eight to twelve weeks. The
            way a man is read in a room changes around the same time. Whether the rest of his life
            moves with it is up to him.
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
            and identifies the structural variables holding you back the most. You receive your
            full report and your personalized protocol within seventy-two hours.
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
          <p className="f2-offer__guarantee">90-day guarantee · If your shape hasn't moved, full refund</p>
        </div>

        <p className="f2-footer-disclosure">
          The findings cited in this article are drawn from a meta-analysis of physical attractiveness
          research and the operating literature of aesthetic medicine practices. Self-reported outcomes
          refer to the first 2,500 men who completed the Attractiveness Protocol cycle and responded
          to the post-protocol survey. Individual results vary with starting frame, age, and adherence.
          Confidence, income, and dating engagement figures are self-reported and not causally
          attributable to the protocol alone.
        </p>

        <footer className="f2-page-footer">
          © 2026 Body &amp; Performance · Editorial · All rights reserved
        </footer>

      </article>
    </div>
  );
}

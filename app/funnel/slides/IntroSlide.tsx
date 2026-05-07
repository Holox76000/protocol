"use client";

import Image from "next/image";
import type { AdVariant } from "../../../lib/ad-variants";
import { DEFAULT_VARIANT } from "../../../lib/ad-variants";
import styles from "./slides.module.css";

function TpStar({ fill = 1, size = 20 }: { fill?: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, borderRadius: 2 }}>
      <div style={{ position: "absolute", inset: 0, background: "#dcdce6", borderRadius: 2 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct}%`, background: "#00b67a", overflow: "hidden" }} />
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        <path d="M12 4.5L13.85 9.62L18.7 9.94L14.95 13.13L16.18 18L12 15.32L7.82 18L9.05 13.13L5.3 9.94L10.15 9.62L12 4.5Z" fill="#fff" />
      </svg>
    </div>
  );
}

const PRESS_LOGOS = [
  { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
];

const STAR_FILLS = [1, 1, 1, 1, 0.5];

type Props = {
  onNext: () => void;
  variant?: AdVariant;
};

export function IntroSlide({ onNext, variant }: Props) {
  const v = variant ?? DEFAULT_VARIANT;
  return (
    <div className={styles.card}>
      <div className={styles.introInner}>

        {/* Top bar */}
        <div className={styles.introTopBar}>
          <Image
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={80}
            height={24}
            className={styles.introLogo}
            priority
          />
          <span className={styles.introTopMeta}>Free · 2 min · No card</span>
        </div>

        {v.badge && <p className={styles.eyebrow}>{v.badge}</p>}

        <h1 className={styles.introTitle}>{v.headline}</h1>

        <p className={styles.introBody}>{v.subtext}</p>

        {/* Meta strip */}
        <div className={styles.introMetaStrip}>
          <div className={styles.introMetaCol}>
            <div className={styles.introMetaVal}>2 min</div>
            <div className={styles.introMetaLabel}>To complete</div>
          </div>
          <div className={styles.introMetaDiv} />
          <div className={styles.introMetaCol}>
            <div className={`${styles.introMetaVal} ${styles.introMetaMono}`}>11</div>
            <div className={styles.introMetaLabel}>Questions</div>
          </div>
          <div className={styles.introMetaDiv} />
          <div className={styles.introMetaCol}>
            <div className={styles.introMetaVal}>Free</div>
            <div className={styles.introMetaLabel}>No card</div>
          </div>
        </div>

        {/* Press */}
        <div className={styles.introPressBlock}>
          <span className={styles.introPressLabel}>As seen in</span>
          <div className={styles.introPressLogos}>
            {PRESS_LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={logo.alt} src={logo.src} alt={logo.alt} className={styles.introPressLogo} />
            ))}
          </div>
        </div>

        {/* Trustpilot */}
        <div className={styles.introTrustRow}>
          <div className={styles.introTrustTopLine}>
            <span className={styles.introRatingLabel}>Great</span>
            <div className={styles.introRatingStars}>
              {STAR_FILLS.map((fill, i) => (
                <TpStar key={i} fill={fill} size={20} />
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/trustpilot-logo.png" alt="Trustpilot" className={styles.introRatingTpLogo} />
          </div>
          <span className={styles.introTrustReview}>
            <span className={styles.introMono}>4.9</span> · 2,500+ reviews
          </span>
        </div>

        {/* Inline CTA — desktop only */}
        <div className={styles.introCtaInline}>
          <button type="button" className={styles.btnPrimary} onClick={onNext}>
            {v.cta ?? "Start the assessment →"}
          </button>
          <div className={styles.introCtaCaption}>
            <span className={styles.introCaptionPair}>✓ Free</span>
            <span className={styles.introCaptionDot}>·</span>
            <span>No signup</span>
            <span className={styles.introCaptionDot}>·</span>
            <span>Skip anytime</span>
          </div>
        </div>

      </div>

      {/* Sticky CTA — mobile only */}
      <div className={`${styles.actionsFull} ${styles.introCtaSticky}`}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          {v.cta ?? "Start the assessment →"}
        </button>
        <div className={styles.introCtaCaption}>
          <span className={styles.introCaptionPair}>✓ Free</span>
          <span className={styles.introCaptionDot}>·</span>
          <span>No signup</span>
          <span className={styles.introCaptionDot}>·</span>
          <span>2 min</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import type { AdVariant } from "../../../lib/ad-variants";
import { DEFAULT_VARIANT } from "../../../lib/ad-variants";
import styles from "./slides.module.css";

function TpStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01z" />
    </svg>
  );
}

const PRESS_LOGOS = [
  { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
  { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
];

type Props = {
  onNext: () => void;
  variant?: AdVariant;
};

export function IntroSlide({ onNext, variant }: Props) {
  const v = variant ?? DEFAULT_VARIANT;
  return (
    <div className={styles.card}>
      <div className={styles.introInner}>
        <Image
          src="/program/static/landing/images/shared/Prtcl.png"
          alt="Protocol"
          width={80}
          height={24}
          className={styles.introLogo}
          priority
        />
        {v.badge && <p className={styles.eyebrow}>{v.badge}</p>}
        <h1 className={styles.introTitle}>{v.headline}</h1>
        <p className={styles.introBody}>{v.subtext}</p>
        <div className={styles.introPress}>
          <span className={styles.introPressLabel}>As seen on</span>
          <div className={styles.introPressLogos}>
            {PRESS_LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className={styles.introPressLogo}
              />
            ))}
          </div>
        </div>
        <div className={styles.introRating}>
          <div className={styles.introRatingRow}>
            <span className={styles.introRatingLabel}>Great</span>
            <div className={styles.introRatingStars}>
              <div className={styles.introRatingStar}><TpStar /></div>
              <div className={styles.introRatingStar}><TpStar /></div>
              <div className={styles.introRatingStar}><TpStar /></div>
              <div className={styles.introRatingStar}><TpStar /></div>
              <div className={`${styles.introRatingStar} ${styles.introRatingStarHalf}`}><TpStar /></div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/trustpilot-logo.png" alt="Trustpilot" className={styles.introRatingTpLogo} />
          </div>
          <span className={styles.introRatingCount}>4.9 · 2,500+ reviews</span>
        </div>
      </div>

      <div className={styles.actionsFull}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          {v.cta ?? "Start the assessment →"}
        </button>
      </div>
    </div>
  );
}

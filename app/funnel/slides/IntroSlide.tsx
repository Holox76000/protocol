"use client";

import Image from "next/image";
import type { AdVariant } from "../../../lib/ad-variants";
import { DEFAULT_VARIANT } from "../../../lib/ad-variants";
import styles from "./slides.module.css";

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M9 1.5l2.03 4.11 4.53.66-3.28 3.2.77 4.51L9 11.77l-4.05 2.21.77-4.51L2.44 6.27l4.53-.66z" />
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
          <div className={styles.introRatingStars}>
            <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
          </div>
          <span className={styles.introRatingScore}>4.9</span>
          <span className={styles.introRatingCount}>· 2,500+ members</span>
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

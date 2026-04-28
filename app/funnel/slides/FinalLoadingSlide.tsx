"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

const ITEMS = [
  "Analyzing your ratios...",
  "Matching peer-reviewed studies...",
  "Calibrating to your social context...",
  "Building your 12-week routine...",
  "Finalizing recommendations...",
];

type Props = {
  answers: Answers;
};

function buildRedirectUrl(answers: Answers): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(answers)) {
    if (Array.isArray(val)) {
      params.set(key, val.join("|"));
    } else if (val) {
      params.set(key, val);
    }
  }
  params.set("funnel", "quiz");
  return `/f1/offer?${params.toString()}`;
}

export function FinalLoadingSlide({ answers }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= ITEMS.length) {
      const t = setTimeout(() => router.push(buildRedirectUrl(answers)), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 900);
    return () => clearTimeout(t);
  }, [active, answers, router]);

  return (
    <div className={styles.card}>
      <div className={styles.spinnerInner}>
        <div className={styles.spinnerRing} />
        <h2 className={styles.spinnerTitle}>
          Building your Protocol.
        </h2>
        <div className={styles.spinnerChecklist}>
          {ITEMS.map((item, i) => (
            <div
              key={item}
              className={`${styles.checkItem} ${
                i < active ? styles.checkItemDone : ""
              } ${i === active ? styles.checkItemActive : ""}`}
            >
              <span className={styles.checkItemDot} />
              {item.replace("...", i < active ? " ✓" : "...")}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

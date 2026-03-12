"use client";

import { useEffect, useState } from "react";
import type { FunnelVariant } from "../../lib/funnels";
import BeforeAfterSlider from "./BeforeAfterSlider";

type HeroComparisonProps = {
  funnel: FunnelVariant;
  defaultBeforeSrc: string;
  defaultAfterSrc: string;
  previewId?: string;
};

const PREVIEW_STORAGE_PREFIX = "protocol-preview:";

export default function HeroComparison({
  funnel,
  defaultBeforeSrc,
  defaultAfterSrc,
  previewId,
}: HeroComparisonProps) {
  const [preview, setPreview] = useState<{ beforeSrc: string; afterSrc: string } | null>(null);

  useEffect(() => {
    if (funnel !== "f2" || !previewId) return;

    let isActive = true;

    const syncPreview = async () => {
      try {
        const cachedPreview = window.sessionStorage.getItem(`${PREVIEW_STORAGE_PREFIX}${previewId}`);
        if (cachedPreview) {
          const parsed = JSON.parse(cachedPreview) as { beforeSrc?: string; afterSrc?: string };
          if (isActive && parsed.beforeSrc && parsed.afterSrc) {
            setPreview({
              beforeSrc: parsed.beforeSrc,
              afterSrc: parsed.afterSrc,
            });
            return;
          }
        }

        const response = await fetch(`/generated/previews/${previewId}.json`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Preview metadata request failed with status ${response.status}`);
        }

        const parsed = (await response.json()) as { beforeSrc?: string; afterSrc?: string };
        console.log("[hero-comparison] loaded preview metadata", {
          previewId,
          beforeSrc: parsed.beforeSrc,
          afterSrc: parsed.afterSrc,
        });

        if (isActive && parsed.beforeSrc && parsed.afterSrc) {
          setPreview({
            beforeSrc: parsed.beforeSrc,
            afterSrc: parsed.afterSrc,
          });
        }
      } catch (error) {
        console.error("[hero-comparison] failed to load preview", error);
      }
    };

    void syncPreview();

    return () => {
      isActive = false;
    };
  }, [funnel, previewId]);

  return (
    <BeforeAfterSlider
      subject="Man"
      beforeSrc={preview?.beforeSrc ?? defaultBeforeSrc}
      afterSrc={preview?.afterSrc ?? defaultAfterSrc}
      beforePosition="68% 50%"
      afterPosition="50% 50%"
      beforeScale={1}
      beforeTranslateX="0%"
    />
  );
}

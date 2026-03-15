"use client";

import type { CSSProperties, ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGa4Event } from "../../lib/ga4Event";
import { clearVisualizationPreview, loadVisualizationPreview, saveVisualizationPreview } from "../../lib/visualizationPreviewClient";
import {
  getMainVisualizationScreenHref,
  getVisualizationStepHref,
  getVisualizationStepNumber,
  type VisualizationScreenMode,
  type VisualizationStep,
} from "../../lib/visualizationFlow";
import { getFunnelConfig, type FunnelVariant } from "../../lib/funnels";
import BeforeAfterSlider from "../program/BeforeAfterSlider";
import styles from "./visualization.module.css";

const DEFAULT_PROMPT =
  "Create a realistic athletic transformation preview of this exact person. Preserve identity, face, skin tone, hair, camera angle, and lighting. Improve body composition into a natural muscular physique with broader shoulders, more upper chest, visible arms, a tighter waist, and lower body fat. Keep the result believable, proportional, and non-steroidal.";

type ApiResponse =
  | {
      imageUrl: string;
      sourceImageUrl?: string;
      previewId?: string;
    }
  | {
      error?: string;
    };

function parseMimeTypeFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,/);
  return match?.[1] ?? "image/png";
}

function fileNameFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return "upload.jpg";
  if (mimeType === "image/webp") return "upload.webp";
  return "upload.png";
}

async function blobFromImageUrl(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    const response = await fetch(imageUrl);
    return response.blob();
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("The generated preview could not be loaded.");
  }

  return response.blob();
}

async function parseApiResponse(response: Response) {
  const raw = await response.text();

  if (!raw.trim()) {
    throw new Error("The visualizer returned an empty response.");
  }

  try {
    return JSON.parse(raw) as ApiResponse;
  } catch {
    if (response.ok) {
      throw new Error(`The visualizer returned an invalid response.\n\nStatus: ${response.status}`);
    }

    return {
      error: `Visualization request failed.\n\nStatus: ${response.status}\n\nRaw response:\n${raw}`,
    } satisfies ApiResponse;
  }
}

const FLOW_STEPS = [
  {
    number: "01",
    shortLabel: "Upload",
    title: "Upload",
    description: "Add one clear shirtless front-facing body photo.",
  },
  {
    number: "02",
    shortLabel: "Preview",
    title: "Preview",
    description: "Generate your realistic transformation preview.",
  },
  {
    number: "03",
    shortLabel: "Unlock",
    title: "Unlock",
    description: "Use the preview to continue into your plan.",
  },
] as const;

const MOBILE_UPLOAD_INTRO = [
  {
    title: "Upload one clear body photo",
    description: "Use a clear shirtless front-facing photo in clean light. It stays private and is only used to generate your preview.",
  },
  {
    title: "We generate a realistic preview",
    description: "Built from your actual starting point, not a generic fake transformation. A shirtless photo helps the preview read your frame accurately.",
  },
  {
    title: "Then you continue into your plan",
    description: "Use the preview as the visual anchor for the next step. You can always replace the photo before moving on.",
  },
] as const;

const VALUE_ITEMS = [
  {
    icon: "scan",
    title: "Complete body composition analysis",
    description: "100+ metrics across chest, waist, shoulders, belly, posture, and fat distribution.",
    anchor: "$150+ at clinics",
  },
  {
    icon: "plan",
    title: "12-week transformation protocol",
    description: "Training, nutrition, and supplements — built for your specific body type and goals.",
    anchor: "$300/mo with a trainer",
  },
  {
    icon: "eye",
    title: "Realistic body visualization",
    description: "Your target physique based on your actual frame, proportions, and genetics.",
    anchor: null,
  },
  {
    icon: "team",
    title: "Specialist + AI review",
    description: "Your photos and questionnaire analyzed personally by our team within 7 days.",
    anchor: null,
  },
  {
    icon: "chat",
    title: "Direct access to our team",
    description: "Ask questions, get adjustments. We adapt if something doesn't fit your lifestyle.",
    anchor: null,
  },
  {
    icon: "track",
    title: "Lifetime progress tracking",
    description: "Rebook your analysis anytime to measure results and adjust your protocol.",
    anchor: null,
  },
] as const;

const OBJECTIONS = [
  {
    question: "Is $19 really all I pay?",
    answer: "Yes. One payment, lifetime access. No subscription, no hidden fees, no upsells.",
  },
  {
    question: "What if it doesn't work for me?",
    answer: "You're covered by our 14-day no-questions-asked money-back guarantee. Zero risk.",
  },
  {
    question: "How long until I get my plan?",
    answer: "Up to 7 days. Our team personally reviews your photos, questionnaire, and body metrics before delivering your protocol.",
  },
  {
    question: "Is this just another generic fitness plan?",
    answer: "No. We analyze 100+ body composition metrics specific to your frame, fat distribution, and physique goals — backed by 2,000+ peer-reviewed studies.",
  },
] as const;

export default function VisualizationExperience({
  funnel = "main",
  step,
  screenMode = "default",
}: {
  funnel?: FunnelVariant;
  step: VisualizationStep;
  screenMode?: VisualizationScreenMode;
}) {
  const funnelConfig = getFunnelConfig(funnel);
  const router = useRouter();
  const currentStep = getVisualizationStepNumber(step);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sourceImageRatio, setSourceImageRatio] = useState<number | null>(null);
  const [resultImageRatio, setResultImageRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [uploadIntroDismissed, setUploadIntroDismissed] = useState(false);
  const [showNextStepIntro, setShowNextStepIntro] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const hasTrackedUnlockRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const restorePreview = async () => {
      try {
        const storedPreview = await loadVisualizationPreview(funnel);
        if (!isActive || !storedPreview?.beforeBlob) return;

        setSourceBlob(storedPreview.beforeBlob);
        setResultBlob(storedPreview.afterBlob ?? null);
        setPreviewId(storedPreview.previewId ?? null);
      } catch (nextError) {
        console.error("[visualization] failed to restore preview", nextError);
      } finally {
        if (isActive) {
          setIsRestoring(false);
        }
      }
    };

    void restorePreview();

    return () => {
      isActive = false;
    };
  }, [funnel]);

  useEffect(() => {
    if (!sourceBlob) {
      setSourceUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(sourceBlob);
    setSourceUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [sourceBlob]);

  useEffect(() => {
    if (!resultBlob) {
      setResultUrl(null);
      setResultImageRatio(null);
      return;
    }

    const nextUrl = URL.createObjectURL(resultBlob);
    setResultUrl(nextUrl);

    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setResultImageRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = nextUrl;

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [resultBlob]);

  useEffect(() => {
    if (isRestoring) return;

    if (step === "preview" && !sourceBlob) {
      router.replace(getVisualizationStepHref(funnel, "upload"));
      return;
    }

    if (step === "unlock" && !resultBlob) {
      router.replace(getVisualizationStepHref(funnel, sourceBlob ? "preview" : "upload"));
    }
  }, [funnel, isRestoring, resultBlob, router, sourceBlob, step]);

  useEffect(() => {
    if (step !== "unlock") {
      hasTrackedUnlockRef.current = false;
      return;
    }

    if (isRestoring || step !== "unlock" || hasTrackedUnlockRef.current) {
      return;
    }

    hasTrackedUnlockRef.current = true;
    trackGa4Event("visualization_completed", {
      funnel,
      step,
    });
  }, [funnel, isRestoring, step]);

  useEffect(() => {
    if (currentStep !== 1) {
      setUploadIntroDismissed(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 3) {
      setShowNextStepIntro(false);
    }
  }, [currentStep]);

  const setFile = async (file: File | null) => {
    setError(null);
    setSourceImageRatio(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setSourceBlob(file);
    setResultBlob(null);
    setPreviewId(null);

    try {
      await clearVisualizationPreview(funnel);
      await saveVisualizationPreview(funnel, {
        beforeBlob: file,
        afterBlob: null,
        previewId: null,
      });
      trackGa4Event("photo_uploaded", {
        funnel,
        step: "upload",
        file_type: file.type,
      });
      router.push(getVisualizationStepHref(funnel, "preview"));
    } catch (nextError) {
      console.error("[visualization] failed to persist source image", nextError);
      setError("The selected image could not be saved locally.");
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await setFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!sourceBlob || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      trackGa4Event("preview_generation_started", {
        funnel,
        step: "preview",
      });
      const mimeType = sourceBlob.type || "image/png";
      const formData = new FormData();
      formData.append("image", new File([sourceBlob], fileNameFromMimeType(mimeType), { type: mimeType }));
      formData.append("prompt", DEFAULT_PROMPT);

      const response = await fetch("/api/visualize", {
        method: "POST",
        body: formData,
      });

      const payload = await parseApiResponse(response);

      if (!response.ok || !("imageUrl" in payload)) {
        throw new Error(
          "error" in payload ? payload.error ?? "The visualizer could not generate an image." : "The visualizer could not generate an image."
        );
      }

      const nextResultBlob = await blobFromImageUrl(payload.imageUrl);

      setResultBlob(nextResultBlob);
      setPreviewId(payload.previewId ?? null);

      await saveVisualizationPreview(funnel, {
        beforeBlob: sourceBlob,
        afterBlob: nextResultBlob,
        previewId: payload.previewId ?? null,
      });

      trackGa4Event("preview_generation_succeeded", {
        funnel,
        step: "preview",
      });

      router.push(getVisualizationStepHref(funnel, "unlock"));
    } catch (nextError) {
      console.error("[visualization] generation failed", nextError);
      trackGa4Event("preview_generation_failed", {
        funnel,
        step: "preview",
        error_message: nextError instanceof Error ? nextError.message : "unknown_error",
      });
      setError(nextError instanceof Error ? nextError.message : "The visualizer failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setError(null);
    setSourceBlob(null);
    setResultBlob(null);
    setPreviewId(null);
    setSourceImageRatio(null);
    await clearVisualizationPreview(funnel);
    router.push(getVisualizationStepHref(funnel, "upload"));
  };

  const openFilePicker = () => inputRef.current?.click();
  const previewFrameStyle =
    currentStep === 2 && sourceImageRatio
      ? ({
          "--preview-ratio": String(sourceImageRatio),
        } as CSSProperties)
      : undefined;
  const compareFrameStyle =
    currentStep === 3 && sourceImageRatio
      ? ({
          "--compare-ratio": String(sourceImageRatio),
        } as CSSProperties)
      : undefined;
  const currentStepMeta = FLOW_STEPS[currentStep - 1];
  const showUploadIntro =
    screenMode === "uploadIntro" || (funnel !== "main" && currentStep === 1 && isMobileViewport && !uploadIntroDismissed);
  const isUploadPage = currentStep === 1 && !showUploadIntro;
  const isPreviewPage = currentStep === 2;
  const isUnlockPage = currentStep === 3;
  const showUnlockInfo = screenMode === "unlockInfo" || (funnel !== "main" && showNextStepIntro);
  const currentYear = new Date().getFullYear();

  if (isRestoring) {
    return (
      <main className={styles.page}>
        <div className={styles.flowShell}>
          <div className={styles.flowLayout}>
            <section className={styles.workspace}>
              <div className={styles.flowCard}>
                <div className={styles.flowHeader}>
                  <p className={styles.flowEyebrow}>Loading</p>
                  <h1 className={styles.flowTitle}>Restoring your visualization</h1>
                  <p className={styles.flowSubtitle}>Please wait while we reload your current step.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.flowShell}>
        <div className={`${styles.flowLayout} ${styles.flowLayoutSingle}`}>
          <input ref={inputRef} className={styles.fileInput} type="file" accept="image/*" onChange={handleFileChange} />
          <section className={styles.workspace}>
            <div className={styles.flowCard}>
              {/* Brand: intro has own, all other steps get compact bar with step badge */}
              {showUploadIntro ? null : isUploadPage ? (
                <div className={styles.uploadBrandBar}>
                  <div className={styles.uploadBrandLeft}>
                    <img
                      src="/program/static/landing/images/shared/Prtcl.png"
                      alt="Protocol"
                      className={styles.introBrandLogo}
                    />
                  </div>
                  <span className={styles.uploadStepBadge}>Step 1 of 3</span>
                </div>
              ) : isPreviewPage ? (
                <div className={styles.uploadBrandBar}>
                  <div className={styles.uploadBrandLeft}>
                    <img
                      src="/program/static/landing/images/shared/Prtcl.png"
                      alt="Protocol"
                      className={styles.introBrandLogo}
                    />
                  </div>
                  <span className={styles.uploadStepBadge}>Step 2 of 3</span>
                </div>
              ) : isUnlockPage ? (
                <div className={styles.uploadBrandBar}>
                  <div className={styles.uploadBrandLeft}>
                    <img
                      src="/program/static/landing/images/shared/Prtcl.png"
                      alt="Protocol"
                      className={styles.introBrandLogo}
                    />
                  </div>
                  <span className={styles.uploadStepBadge}>Step 3 of 3</span>
                </div>
              ) : null}

              {/* Step rail hidden on all redesigned pages */}

              {showUploadIntro ? (
                <>
                  {/* ── Brand bar ── */}
                  <div className={styles.introBrandBar}>
                    <img
                      src="/program/static/landing/images/shared/Prtcl.png"
                      alt="Protocol"
                      className={styles.introBrandLogo}
                    />
                    <span className={styles.introBrandLabel}>Body Composition Analysis</span>
                  </div>

                  {/* ── Hero: copy left + visual right ── */}
                  <div className={styles.introHero}>
                    <div className={styles.introHeroCopy}>
                      <h1 className={styles.introHeadline}>
                        See what your body could look like
                      </h1>
                      <p className={styles.introSubhead}>
                        Upload one front-facing photo. Our system reads your frame — shoulders, waist, proportions — and generates a realistic preview of your physique in under 60 seconds.
                      </p>
                      <div className={styles.introCtaGroup}>
                        <button
                          type="button"
                          className={styles.introCtaButton}
                          onClick={() => {
                            if (funnel === "main") {
                              router.push(getMainVisualizationScreenHref("upload"));
                              return;
                            }
                            setUploadIntroDismissed(true);
                          }}
                        >
                          Upload my photo
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className={styles.introCtaMeta}>
                          Free · No account needed · 60 seconds
                        </span>
                      </div>
                    </div>

                    {/* Visual: before → after preview concept */}
                    <div className={styles.introVisual}>
                      <div className={styles.introVisualInner}>
                        <div className={styles.introVisualPane}>
                          <div className={styles.introVisualFrame}>
                            <svg className={styles.introVisualSilhouette} width="80" height="120" viewBox="0 0 80 120" fill="none" aria-hidden="true">
                              <circle cx="40" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M22 52C22 42.059 30.059 34 40 34C49.941 34 58 42.059 58 52V72C58 74.209 56.209 76 54 76H26C23.791 76 22 74.209 22 72V52Z" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M26 76V108C26 110.209 27.791 112 30 112H50C52.209 112 54 110.209 54 108V76" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </div>
                          <span className={styles.introVisualLabel}>Your photo</span>
                        </div>
                        <div className={styles.introVisualArrow}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className={`${styles.introVisualPane} ${styles.introVisualPaneResult}`}>
                          <div className={`${styles.introVisualFrame} ${styles.introVisualFrameResult}`}>
                            <svg className={styles.introVisualSilhouette} width="80" height="120" viewBox="0 0 80 120" fill="none" aria-hidden="true">
                              <circle cx="40" cy="18" r="12" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M18 52C18 42.059 27.059 34 40 34C52.941 34 62 42.059 62 52V70C62 72.209 60.209 74 58 74H22C19.791 74 18 72.209 18 70V52Z" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M24 74V108C24 110.209 25.791 112 28 112H52C54.209 112 56 110.209 56 108V74" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </div>
                          <span className={styles.introVisualLabel}>Your preview</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Trust strip ── */}
                  <div className={styles.introTrustStrip}>
                    <div className={styles.introTrustItem}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                        <path d="M7.5 1.25L3.125 3.75V6.875C3.125 10.125 4.97 13.163 7.5 13.75C10.03 13.163 11.875 10.125 11.875 6.875V3.75L7.5 1.25Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.625 7.5L6.875 8.75L9.375 6.25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Encrypted & permanently deleted</span>
                    </div>
                    <span className={styles.introTrustDot} />
                    <div className={styles.introTrustItem}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                        <path d="M11.25 3.125L5 9.375L2.5 6.875" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>14,000+ previews generated</span>
                    </div>
                    <span className={styles.introTrustDot} />
                    <div className={styles.introTrustItem}>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                        <path d="M11.25 3.125L5 9.375L2.5 6.875" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>No account or credit card</span>
                    </div>
                  </div>

                  {/* ── How it works ── */}
                  <div className={styles.introProcess}>
                    <div className={styles.introProcessStep} style={{ "--step-index": 0 } as CSSProperties}>
                      <span className={styles.introProcessNum}>01</span>
                      <strong>Upload one photo</strong>
                      <span>One clear front-facing shirtless photo. Good light, neutral pose.</span>
                    </div>
                    <div className={styles.introProcessStep} style={{ "--step-index": 1 } as CSSProperties}>
                      <span className={styles.introProcessNum}>02</span>
                      <strong>We read your frame</strong>
                      <span>Our system analyzes your shoulders, waist, and proportions to build an accurate model.</span>
                    </div>
                    <div className={styles.introProcessStep} style={{ "--step-index": 2 } as CSSProperties}>
                      <span className={styles.introProcessNum}>03</span>
                      <strong>See your realistic preview</strong>
                      <span>Get a before &amp; after comparison. Slide to see the difference, then continue to your plan.</span>
                    </div>
                  </div>

                  {/* ── Privacy block ── */}
                  <div className={styles.introPrivacy}>
                    <div className={styles.introPrivacyIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <rect x="3.5" y="9" width="13" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
                        <path d="M6 9V6C6 3.79086 7.79086 2 10 2C12.2091 2 14 3.79086 14 6V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <circle cx="10" cy="13.25" r="1.25" fill="currentColor" />
                      </svg>
                    </div>
                    <div className={styles.introPrivacyCopy}>
                      <strong>Your privacy is non-negotiable</strong>
                      <span>Your photo is encrypted in transit, processed on secure servers, and permanently deleted after your preview is generated. It is never stored, never shared, and never seen by anyone — including our team.</span>
                    </div>
                  </div>
                </>
              ) : null}

              {/* ── Upload page: CRO-optimized layout ── */}
              {isUploadPage ? (
                <>
                  <div className={styles.uploadHeader}>
                    <h1 className={styles.uploadHeadline}>Upload your photo</h1>
                    <p className={styles.uploadSubhead}>
                      One clear front-facing shirtless photo — that&apos;s all we need to generate your realistic preview.
                    </p>
                  </div>

                  <div className={styles.uploadColumns}>
                    {/* Left: dropzone */}
                    <button
                      type="button"
                      className={`${styles.uploadDropzone} ${isDragging ? styles.uploadDropzoneActive : ""}`}
                      onClick={openFilePicker}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      <div className={styles.uploadDropzoneIcon}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                          <rect x="4" y="6" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.6" />
                          <circle cx="12" cy="14" r="3" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M4 22L10.586 15.414C11.367 14.633 12.633 14.633 13.414 15.414L20 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M18 20L20.586 17.414C21.367 16.633 22.633 16.633 23.414 17.414L28 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <path d="M16 2V8M16 2L13 5M16 2L19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className={styles.uploadDropzoneCopy}>
                        <strong>Drop your photo here</strong>
                        <span>or click to select from your device</span>
                      </div>
                      <span className={styles.uploadDropzoneFormat}>JPG, PNG or WEBP</span>
                    </button>

                    {/* Right: photo guide + privacy */}
                    <div className={styles.uploadGuide}>
                      <div className={styles.uploadGuideSection}>
                        <span className={styles.uploadGuideTitle}>Photo requirements</span>
                        <div className={styles.uploadGuideList}>
                          <div className={styles.uploadGuideDo}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span><strong>Shirtless</strong> — full torso visible, no shirt or cover</span>
                          </div>
                          <div className={styles.uploadGuideDo}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span><strong>Front-facing</strong> — straight posture, facing the camera</span>
                          </div>
                          <div className={styles.uploadGuideDo}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span><strong>Good lighting</strong> — natural light, clear and even</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.uploadGuideSection}>
                        <span className={styles.uploadGuideTitle}>Avoid</span>
                        <div className={styles.uploadGuideList}>
                          <div className={styles.uploadGuideDont}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>Heavy filters, edits, or bad lighting</span>
                          </div>
                          <div className={styles.uploadGuideDont}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span>Cropped, angled, or covered torso</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.uploadGuidePrivacy}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <rect x="3" y="7.5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M5 7.5V5C5 2.79086 6.79086 1 9 1V1C11.2091 1 13 2.79086 13 5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          <circle cx="8" cy="10.75" r="1" fill="currentColor" />
                        </svg>
                        <span>Your photo is encrypted in transit and permanently deleted after your preview is generated. No one sees it.</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* ── Preview page: photo confirmation + generate CTA ── */}
              {isPreviewPage ? (
                <>
                  <div className={styles.previewHeader}>
                    <h1 className={styles.previewHeadline}>Does this look right?</h1>
                    <p className={styles.previewSubhead}>
                      Make sure your face and torso are clearly visible. Better photo = more accurate preview.
                    </p>
                  </div>

                  <div className={styles.previewPhotoArea}>
                    <div className={styles.previewFrame} style={previewFrameStyle}>
                      {sourceUrl ? (
                        <img
                          src={sourceUrl}
                          alt="Uploaded photo"
                          className={styles.previewPhoto}
                          onLoad={(event) => {
                            const { naturalWidth, naturalHeight } = event.currentTarget;
                            if (naturalWidth > 0 && naturalHeight > 0) {
                              setSourceImageRatio(naturalWidth / naturalHeight);
                            }
                          }}
                        />
                      ) : null}
                      <div className={styles.previewPhotoCheck}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                          <circle cx="9" cy="9" r="9" fill="#2d7a53" />
                          <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Photo detected</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.previewCta}
                      onClick={handleGenerate}
                      disabled={!sourceBlob || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className={styles.previewCtaSpinner} />
                          Analyzing your physique…
                        </>
                      ) : (
                        "Generate my preview"
                      )}
                    </button>
                    <button type="button" className={styles.previewChangeLink} onClick={openFilePicker}>
                      Use a different photo
                    </button>
                  </div>

                  <div className={styles.previewReassurance}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="3" y="7.5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M5 7.5V5C5 2.79086 6.79086 1 9 1V1C11.2091 1 13 2.79086 13 5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <circle cx="8" cy="10.75" r="1" fill="currentColor" />
                    </svg>
                    <span>Your photo is encrypted and permanently deleted after preview generation. No one sees it.</span>
                  </div>
                </>
              ) : null}

              {/* ── Unlock page: before/after comparison + next steps ── */}
              {isUnlockPage ? (
                <>
                  {!showUnlockInfo ? (
                    <>
                      <div className={styles.unlockHeader}>
                        <h1 className={styles.unlockHeadline}>This could be you</h1>
                        <p className={styles.unlockSubhead}>
                          Drag the slider to compare your current photo with your realistic transformation preview.
                        </p>
                      </div>

                      <div className={styles.unlockCompare}>
                        <div className={styles.unlockCompareLabels}>
                          <span className={styles.unlockLabelBefore}>Now</span>
                          <span className={styles.unlockLabelAfter}>Your potential</span>
                        </div>
                        <div className={styles.compareFrame} style={compareFrameStyle}>
                          {sourceUrl && resultUrl ? (
                            <BeforeAfterSlider
                              className={styles.compareSlider}
                              subject="Potential body preview"
                              beforeSrc={sourceUrl}
                              afterSrc={resultUrl}
                              beforeAlt="Current body preview"
                              afterAlt="Potential body preview"
                              beforePosition="50% 18%"
                              afterPosition="50% 18%"
                              afterScale={
                                sourceImageRatio && resultImageRatio
                                  ? Math.min(1, resultImageRatio / sourceImageRatio)
                                  : 1
                              }
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className={styles.unlockActions}>
                        <button
                          type="button"
                          className={styles.unlockCta}
                          onClick={() => {
                            if (funnel === "main") {
                              router.push(getMainVisualizationScreenHref("unlock-info"));
                              return;
                            }
                            setShowNextStepIntro(true);
                          }}
                        >
                          Continue to your plan
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button type="button" className={styles.unlockBackLink} onClick={handleRestart}>
                          Use a different photo
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ── Hero: before/after anchor + desire headline + first CTA ── */}
                      <div className={styles.infoAnchor}>
                        <div className={styles.infoAnchorThumb}>
                          {sourceUrl ? <img src={sourceUrl} alt="" className={styles.infoAnchorImg} /> : null}
                          <span className={styles.infoAnchorLabel}>Now</span>
                        </div>
                        <div className={styles.infoAnchorArrow}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M7 10H13M13 10L10 7M13 10L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className={styles.infoAnchorThumb}>
                          {resultUrl ? <img src={resultUrl} alt="" className={styles.infoAnchorImg} /> : null}
                          <span className={`${styles.infoAnchorLabel} ${styles.infoAnchorLabelAfter}`}>Your potential</span>
                        </div>
                        <button
                          type="button"
                          className={styles.infoAnchorBack}
                          onClick={() => {
                            if (funnel === "main") {
                              router.push(getMainVisualizationScreenHref("unlock"));
                              return;
                            }
                            setShowNextStepIntro(false);
                          }}
                        >
                          View preview
                        </button>
                      </div>

                      <div className={styles.infoHeader}>
                        <h1 className={styles.infoHeadline}>Make this body yours</h1>
                        <p className={styles.infoSubhead}>
                          Your protocol is built to take you from your current physique to the body you just saw — reviewed by specialists using 2,000+ peer-reviewed studies.
                        </p>
                      </div>

                      {/* ── Above-the-fold CTA (fast path for hot buyers) ── */}
                      <div className={styles.infoHeroCta}>
                        <a
                          href={funnel === "f2" && previewId ? `/f2/landing?preview=${encodeURIComponent(previewId)}` : funnelConfig.visualizationNextHref}
                          className={styles.infoCta}
                          onClick={() =>
                            trackGa4Event("reach_potential_clicked", {
                              funnel,
                              step: "unlock_hero",
                              destination:
                                funnel === "f2" && previewId
                                  ? `/f2/landing?preview=${encodeURIComponent(previewId)}`
                                  : funnelConfig.visualizationNextHref,
                            })
                          }
                        >
                          Get my transformation plan — $19
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                        <div className={styles.infoHeroMeta}>
                          <span>One-time payment</span>
                          <span className={styles.infoHeroMetaDot} />
                          <span>14-day money-back guarantee</span>
                        </div>
                      </div>

                      {/* ── Urgency signal ── */}
                      <div className={styles.infoUrgency}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M8 4.5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Your preview is stored for this session only. Once you close this page, it&apos;s gone.</span>
                      </div>

                      {/* ── Value stack ── */}
                      <div className={styles.infoValueStack}>
                        <div className={styles.infoValueLabel}>Everything included</div>
                        {VALUE_ITEMS.map((item) => (
                          <div key={item.title} className={styles.infoValueItem}>
                            <div className={styles.infoValueIcon}>
                              {item.icon === "scan" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" /><path d="M2 10h16M7 2v16M13 2v16" stroke="currentColor" strokeWidth="1.3" opacity="0.4" /></svg>
                              )}
                              {item.icon === "plan" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                              )}
                              {item.icon === "eye" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                              )}
                              {item.icon === "team" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="13" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 16c0-2.5 2.5-4.5 6-4.5.5 0 1 .04 1.5.12M13 11.5c3.5 0 6 2 6 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                              )}
                              {item.icon === "chat" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3-3-3H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                              )}
                              {item.icon === "track" && (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                              )}
                            </div>
                            <div className={styles.infoValueCopy}>
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                            </div>
                            {item.anchor ? (
                              <span className={styles.infoValueAnchor}>{item.anchor}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>

                      {/* ── How it works (compact) ── */}
                      <div className={styles.infoProcess}>
                        <div className={styles.infoProcessStep}>
                          <span className={styles.infoProcessNum}>1</span>
                          <div>
                            <strong>Complete your assessment</strong>
                            <span>~10 min questionnaire about your habits, goals, and lifestyle</span>
                          </div>
                        </div>
                        <div className={styles.infoProcessDivider} />
                        <div className={styles.infoProcessStep}>
                          <span className={styles.infoProcessNum}>2</span>
                          <div>
                            <strong>We personally build your protocol</strong>
                            <span>Our team + AI reviews your case individually — not an automated template. Delivered within 7 days.</span>
                          </div>
                        </div>
                        <div className={styles.infoProcessDivider} />
                        <div className={styles.infoProcessStep}>
                          <span className={styles.infoProcessNum}>3</span>
                          <div>
                            <strong>Follow your plan, track your progress</strong>
                            <span>Personalized protocol, lifetime access, team support. You&apos;ll receive a confirmation email immediately.</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Price block + main CTA ── */}
                      <div className={styles.infoPriceBlock}>
                        <div className={styles.infoPriceRow}>
                          <div className={styles.infoPriceAmount}>
                            <span className={styles.infoPriceDollar}>$</span>
                            <span className={styles.infoPriceNumber}>19</span>
                            <span className={styles.infoPriceOnce}>one-time</span>
                          </div>
                          <div className={styles.infoPriceAnchorLine}>
                            What personal trainers charge <strong>$300/month</strong> for
                          </div>
                        </div>

                        <a
                          href={funnel === "f2" && previewId ? `/f2/landing?preview=${encodeURIComponent(previewId)}` : funnelConfig.visualizationNextHref}
                          className={styles.infoCta}
                          onClick={() =>
                            trackGa4Event("reach_potential_clicked", {
                              funnel,
                              step: "unlock",
                              destination:
                                funnel === "f2" && previewId
                                  ? `/f2/landing?preview=${encodeURIComponent(previewId)}`
                                  : funnelConfig.visualizationNextHref,
                            })
                          }
                        >
                          Get my transformation plan — $19
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>

                        <div className={styles.infoTrustRow}>
                          <span className={styles.infoTrustItem}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7.5V5C5 2.79086 6.79086 1 9 1V1C11.2091 1 13 2.79086 13 5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="8" cy="10.75" r="1" fill="currentColor" /></svg>
                            Secure payment
                          </span>
                          <span className={styles.infoTrustItem}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            14-day money-back guarantee
                          </span>
                          <span className={styles.infoTrustItem}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            No subscription
                          </span>
                        </div>

                        <div className={styles.infoPayments}>
                          <img src="/program/static/landing/images/home/pricing/visa.webp" alt="Visa" width="60" height="20" />
                          <img src="/program/static/landing/images/home/pricing/mastercard.webp" alt="Mastercard" width="42" height="20" />
                          <img src="/program/static/landing/images/home/pricing/stripe.webp" alt="Stripe" width="52" height="20" />
                          <img src="/program/static/landing/images/home/pricing/paypal.webp" alt="PayPal" width="22" height="20" />
                          <img src="/program/static/landing/images/home/pricing/applepay.webp" alt="Apple Pay" width="20" height="20" />
                        </div>
                      </div>

                      {/* ── Social proof: peer testimonials + authority ── */}
                      <div className={styles.infoSocialProof}>
                        <div className={styles.infoSocialStat}>
                          <strong>25,000+</strong> men have started their transformation
                        </div>

                        <div className={styles.infoTestimonials}>
                          <div className={styles.infoTestimonial}>
                            <div className={styles.infoTestimonialStars}>
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#e8a438"><path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.07l-3.52 1.78.67-3.93L1.3 5.14l3.94-.57L7 1z" /></svg>
                              ))}
                            </div>
                            <p>&ldquo;I was skeptical about $19 but the analysis was more detailed than the $200 nutrition coach I used before. Actually specific to my body, not a template.&rdquo;</p>
                            <cite>— Marcus, 28</cite>
                          </div>
                          <div className={styles.infoTestimonial}>
                            <div className={styles.infoTestimonialStars}>
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#e8a438"><path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.07l-3.52 1.78.67-3.93L1.3 5.14l3.94-.57L7 1z" /></svg>
                              ))}
                            </div>
                            <p>&ldquo;Seeing my preview got me hooked, but the protocol is what actually changed my body. Down 14lbs in 10 weeks and I look completely different.&rdquo;</p>
                            <cite>— Jake, 31</cite>
                          </div>
                        </div>

                        <blockquote className={styles.infoQuote}>
                          <p>&ldquo;Protocol gives men a science-backed roadmap that replaces guesswork with precision. I recommend it.&rdquo;</p>
                          <cite>— Jonathan Zelken, MD — Board-Certified Plastic Surgeon</cite>
                        </blockquote>
                        <div className={styles.infoFeaturedIn}>
                          <span>Featured in</span>
                          <div className={styles.infoLogos}>
                            <img src="/program/static/landing/images/home/logo/usa-today.webp" alt="USA Today" />
                            <img src="/program/static/landing/images/home/logo/gq.webp" alt="GQ" />
                            <img src="/program/static/landing/images/home/logo/business-insider.webp" alt="Business Insider" />
                          </div>
                        </div>
                      </div>

                      {/* ── Objection busters ── */}
                      <div className={styles.infoFaq}>
                        {OBJECTIONS.map((item, index) => (
                          <div
                            key={item.question}
                            className={`${styles.infoFaqItem} ${openFaqIndex === index ? styles.infoFaqItemOpen : ""}`}
                          >
                            <button
                              type="button"
                              className={styles.infoFaqTrigger}
                              onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                              aria-expanded={openFaqIndex === index}
                            >
                              <span>{item.question}</span>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.infoFaqChevron}>
                                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <div className={styles.infoFaqAnswer}>
                              <p>{item.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* ── Final CTA ── */}
                      <div className={styles.infoFinalCta}>
                        <p className={styles.infoFinalText}>Start your transformation — risk-free</p>
                        <a
                          href={funnel === "f2" && previewId ? `/f2/landing?preview=${encodeURIComponent(previewId)}` : funnelConfig.visualizationNextHref}
                          className={styles.infoCta}
                          onClick={() =>
                            trackGa4Event("reach_potential_clicked", {
                              funnel,
                              step: "unlock_final",
                              destination:
                                funnel === "f2" && previewId
                                  ? `/f2/landing?preview=${encodeURIComponent(previewId)}`
                                  : funnelConfig.visualizationNextHref,
                            })
                          }
                        >
                          Get my transformation plan — $19
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                            <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                        <p className={styles.infoFinalGuarantee}>14-day money-back guarantee. No questions asked.</p>
                      </div>
                    </>
                  )}
                </>
              ) : null}

              {error ? <p className={styles.error}>{error}</p> : null}
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerCopy}>© {currentYear} Protocol. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}

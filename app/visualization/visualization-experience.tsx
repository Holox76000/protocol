"use client";

import type { CSSProperties, ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected image could not be read."));
    };
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}

const FLOW_STEPS = [
  {
    number: "01",
    shortLabel: "Upload",
    title: "Upload",
    description: "Add one clear front-facing body photo.",
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

export default function VisualizationExperience({ funnel = "main" }: { funnel?: FunnelVariant }) {
  const funnelConfig = getFunnelConfig(funnel);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [persistedSourceUrl, setPersistedSourceUrl] = useState<string | null>(null);
  const [savedSourceUrl, setSavedSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sourceImageRatio, setSourceImageRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = resultUrl ? 3 : sourceFile ? 2 : 1;

  useEffect(() => {
    if (!sourceFile) {
      setSourceUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(sourceFile);
    setSourceUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [sourceFile]);

  const setFile = async (file: File | null) => {
    setError(null);
    setResultUrl(null);
    setSourceImageRatio(null);

    if (!file) {
      setSourceFile(null);
      setPersistedSourceUrl(null);
      setSavedSourceUrl(null);
      setPreviewId(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPersistedSourceUrl(dataUrl);
      setSourceFile(file);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The selected image could not be read.");
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await setFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!sourceFile || !persistedSourceUrl || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", sourceFile);
      formData.append("prompt", DEFAULT_PROMPT);

      const response = await fetch("/api/visualize", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !("imageUrl" in payload)) {
        throw new Error(
          "error" in payload ? payload.error ?? "The visualizer could not generate an image." : "The visualizer could not generate an image."
        );
      }

      console.log("[visualization] generation succeeded", {
        funnel,
        isDataUrl: payload.imageUrl.startsWith("data:"),
      });

      setResultUrl(payload.imageUrl);
      setSavedSourceUrl(payload.sourceImageUrl ?? persistedSourceUrl);
      setPreviewId(payload.previewId ?? null);
    } catch (nextError) {
      console.error("[visualization] generation failed", nextError);
      setError(nextError instanceof Error ? nextError.message : "The visualizer failed.");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <main className={styles.page}>
      <div className={styles.flowShell}>
        <div className={styles.flowLayout}>
          <input ref={inputRef} className={styles.fileInput} type="file" accept="image/*" onChange={handleFileChange} />
          <section className={styles.workspace}>
            <div className={styles.flowCard}>
              <div className={styles.stepRail} aria-label="Visualization steps">
                {FLOW_STEPS.map((step, index) => {
                  const isActive = currentStep >= index + 1;
                  const isCurrent = currentStep === index + 1;

                  return (
                    <div
                      key={step.number}
                      className={`${styles.stepRailItem} ${isActive ? styles.stepRailItemActive : ""} ${isCurrent ? styles.stepRailItemCurrent : ""}`}
                    >
                      <span className={styles.stepRailIndex}>{step.number}</span>
                      <span className={styles.stepRailCopy}>
                        <strong>{step.title}</strong>
                        <small>{step.description}</small>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.flowHeader}>
                <p className={styles.flowEyebrow}>{currentStepMeta.shortLabel}</p>
                <h1 className={styles.flowTitle}>
                  {currentStep === 1
                    ? "Upload your photo"
                    : currentStep === 2
                      ? "Generate your preview"
                      : "Reach your potential"}
                </h1>
                <p className={styles.flowSubtitle}>
                  {currentStep === 1
                    ? "Use one clear front-facing body photo. We only need a simple, well-lit shot to start."
                    : currentStep === 2
                      ? "Your image is ready. Generate a realistic before and after before moving to the next step."
                      : "Your preview is ready. Continue to unlock the personalized plan built to make it real."}
                </p>
              </div>

              {currentStep === 1 ? (
                <>
                  <button
                    type="button"
                    className={`${styles.uploadPanel} ${isDragging ? styles.uploadPanelActive : ""}`}
                    onClick={openFilePicker}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <span className={styles.uploadIcon}>+</span>
                    <strong>Upload a clear front-facing body photo</strong>
                    <span>JPG, PNG or WEBP. Neutral pose, clean light, torso visible if possible.</span>
                  </button>

                  <div className={styles.helperRow}>
                    <div className={styles.helperCard}>
                      <span>Front-facing</span>
                      <small>Stand straight and keep your full torso visible.</small>
                    </div>
                    <div className={styles.helperCard}>
                      <span>Natural lighting</span>
                      <small>Avoid mirrors that are too dark, blurry shots, or heavy filters.</small>
                    </div>
                    <div className={styles.helperCard}>
                      <span>No pressure</span>
                      <small>You can always change the photo before generating the preview.</small>
                    </div>
                  </div>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className={styles.stageNote}>
                    <span className={styles.stageNoteDot} />
                    <p>Your image is loaded. If it looks good, generate the realistic preview now.</p>
                  </div>

                  <div className={styles.flowActions}>
                    <button type="button" className={styles.secondaryButton} onClick={openFilePicker}>
                      Change image
                    </button>
                    <button type="button" className={styles.primaryButton} onClick={handleGenerate} disabled={!sourceFile || isLoading}>
                      {isLoading ? "Calculating..." : "See my preview"}
                    </button>
                  </div>
                </>
              ) : null}

              {currentStep === 3 ? (
                <>
                  <div className={styles.benefitList}>
                    <div className={styles.benefitItem}>
                      <strong>Realistic</strong>
                      <span>Built from your exact body photo, not a generic mockup.</span>
                    </div>
                    <div className={styles.benefitItem}>
                      <strong>Actionable</strong>
                      <span>Use this preview as the visual anchor for your protocol.</span>
                    </div>
                    <div className={styles.benefitItem}>
                      <strong>Personalized</strong>
                      <span>Unlock the analysis and plan tailored to your starting point.</span>
                    </div>
                  </div>

                  <div className={styles.flowActions}>
                    <button type="button" className={styles.secondaryButton} onClick={openFilePicker}>
                      Use another image
                    </button>
                    <a
                      href={funnel === "f2" && previewId ? `/f2/landing?preview=${encodeURIComponent(previewId)}` : funnelConfig.visualizationNextHref}
                      className={styles.primaryButton}
                    >
                      {funnelConfig.visualizationNextLabel}
                    </a>
                  </div>
                </>
              ) : null}

              {error ? <p className={styles.error}>{error}</p> : null}
            </div>
          </section>

          <aside className={styles.previewPane}>
            <div className={styles.previewCard}>
              <p className={styles.previewEyebrow}>Live preview</p>
              <h2 className={styles.previewTitle}>
                {currentStep === 1 ? "What we’ll generate for you" : currentStep === 2 ? "Your uploaded photo" : "Your before and after"}
              </h2>
              <p className={styles.previewSubtitle}>
                {currentStep === 1
                  ? "A realistic transformation preview based on your exact starting point."
                  : currentStep === 2
                    ? "Check that the framing looks clean before generating your preview."
                    : "Slide to compare where you are now with where you could realistically go."}
              </p>

              {currentStep === 1 ? (
                <div className={styles.previewPlaceholder}>
                  <div className={styles.previewPlaceholderFrame}>
                    <span className={styles.previewPlaceholderBadge}>Before</span>
                    <span className={styles.previewPlaceholderBadgeAlt}>After</span>
                    <div className={styles.previewPlaceholderFigure} />
                  </div>
                  <div className={styles.previewChecklist}>
                    <div><strong>Natural</strong><span>No exaggerated fake fitness edits.</span></div>
                    <div><strong>Personalized</strong><span>Generated from your actual photo and structure.</span></div>
                    <div><strong>Useful</strong><span>A preview that makes the next step feel tangible.</span></div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className={styles.singlePreviewFrame} style={previewFrameStyle}>
                  {sourceUrl ? (
                    <img
                      src={sourceUrl}
                      alt="Uploaded source preview"
                      className={styles.previewImage}
                      onLoad={(event) => {
                        const { naturalWidth, naturalHeight } = event.currentTarget;
                        if (naturalWidth > 0 && naturalHeight > 0) {
                          setSourceImageRatio(naturalWidth / naturalHeight);
                        }
                      }}
                    />
                  ) : null}
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className={styles.compareFrame} style={compareFrameStyle}>
                  {(savedSourceUrl ?? persistedSourceUrl) && resultUrl ? (
                    <BeforeAfterSlider
                      className={styles.compareSlider}
                      subject="Potential body preview"
                      beforeSrc={savedSourceUrl ?? persistedSourceUrl ?? ""}
                      afterSrc={resultUrl}
                      beforeAlt="Current body preview"
                      afterAlt="Potential body preview"
                      beforePosition="50% 18%"
                      afterPosition="50% 18%"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

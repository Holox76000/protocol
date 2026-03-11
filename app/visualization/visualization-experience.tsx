"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import styles from "./visualization.module.css";

const DEFAULT_PROMPT =
  "Create a realistic athletic transformation preview of this exact person. Preserve identity, face, skin tone, hair, camera angle, and lighting. Improve body composition into a natural muscular physique with broader shoulders, more upper chest, visible arms, a tighter waist, and lower body fat. Keep the result believable, proportional, and non-steroidal.";

type ApiResponse =
  | {
      imageUrl: string;
    }
  | {
      error?: string;
    };

const navItems = [
  { label: "Visualizer", href: "/visualization", active: true, badge: null },
  { label: "Interface", href: "/interface", active: false, badge: null },
  { label: "Home", href: "/", active: false, badge: null },
  { label: "Login", href: "/login", active: false, badge: null },
];

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <mask id="visualizer-logo-mask">
          <rect width="32" height="32" fill="black" />
          <circle cx="14" cy="14" r="12" fill="none" stroke="white" strokeWidth="24" />
        </mask>
      </defs>
      <g mask="url(#visualizer-logo-mask)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.11495 19.1086C5.42092 12.6972 5.16924 5.91332 8.55161 3.9569C11.934 1.9993 17.6708 5.61043 21.3649 12.0218C22.8785 14.65 23.8146 17.3407 24.1592 19.7356C25.2647 17.9984 25.9021 15.9571 25.9021 13.7744C25.9021 7.43368 20.5299 2.29395 13.9015 2.29395C7.27441 2.29395 1.90213 7.43368 1.90213 13.7744C1.90213 20.1139 7.27441 25.2536 13.9015 25.2536C14.0039 25.2536 14.1062 25.2524 14.2085 25.2501C12.3715 23.7604 10.5827 21.6554 9.11495 19.1086Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.1592 19.7354C22.1023 22.9658 18.4259 25.1485 14.2085 25.2499C16.9946 27.5104 19.8889 28.353 21.9282 27.1733C23.924 26.0195 24.6543 23.1838 24.1592 19.7354Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default function VisualizationExperience() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const setFile = (file: File | null) => {
    setError(null);
    setResultUrl(null);

    if (!file) {
      setSourceFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setSourceFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!sourceFile || isLoading) return;

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
        throw new Error("error" in payload ? payload.error ?? "The visualizer could not generate an image." : "The visualizer could not generate an image.");
      }

      setResultUrl(payload.imageUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The visualizer failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <a href="/" className={styles.logoLink} aria-label="Protocol home">
              <LogoMark />
            </a>
            <button type="button" className={styles.iconButton} aria-label="Open navigation">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="2.25" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 2.75V15.25" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          <nav className={styles.nav} aria-label="Visualizer sections">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}>
                <MenuGlyph active={item.active} />
                <span>{item.label}</span>
                {item.badge ? <span className={styles.badge}>{item.badge}</span> : null}
              </a>
            ))}
          </nav>

          <a href="/" className={styles.logout}>
            <span className={styles.logoutIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H3.75A1.75 1.75 0 0 0 2 4.75v6.5C2 12.2165 2.7835 13 3.75 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M9 11L12 8L9 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 8H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span>Back to landing</span>
          </a>
        </aside>

        <section className={styles.workspace}>
          <div className={styles.mainColumn}>
            <div className={styles.toolbar}>
              <button type="button" className={styles.customizeButton}>
                <span>Nanobanana body preview</span>
                <span className={styles.sparkle}>✧</span>
              </button>
            </div>

            <header className={styles.hero}>
              <h1 className={styles.title}>
                Preview your <span>future physique</span>
              </h1>
              <p className={styles.subtitle}>
                Upload a clear body photo, keep the prompt realistic, and generate a muscular preview in the same interface language as the rest of Protocol.
              </p>
            </header>

            <section className={styles.compareCard} aria-label="Visualization preview">
              <div className={styles.compareHeader}>
                <div>
                  <p className={styles.eyebrow}>See your potential</p>
                  <p className={styles.compareCaption}>
                    {resultUrl ? "Your visualization is ready." : "Your visualization will appear here."}
                  </p>
                </div>
                <span className={styles.status}>{isLoading ? "Calculating" : resultUrl ? "Ready" : "Waiting"}</span>
              </div>

              <div className={styles.compareFrame}>
                {resultUrl ? (
                  <img className={styles.compareImage} src={resultUrl} alt="Generated muscular preview" />
                ) : sourceUrl ? (
                  <img className={styles.compareImage} src={sourceUrl} alt="Uploaded source preview" />
                ) : (
                  <div className={styles.emptyState}>Upload a body photo to start the preview workflow.</div>
                )}
              </div>
            </section>
          </div>

          <aside className={styles.detailsColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelEyebrow}>Step 1</p>
                  <h2>Upload source image</h2>
                </div>
                <button type="button" className={styles.ghostButton} onClick={() => inputRef.current?.click()}>
                  Choose image
                </button>
              </div>

              <input
                ref={inputRef}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              <button
                type="button"
                className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <span className={styles.dropzoneIcon}>+</span>
                <strong>{sourceFile ? sourceFile.name : "Drop a front-facing body photo here"}</strong>
                <span>JPG, PNG or WEBP. Clear light, neutral pose, full torso if possible.</span>
              </button>

              <div className={styles.thumbRow}>
                <div className={styles.thumbCard}>
                  {sourceUrl ? <img src={sourceUrl} alt="Current body preview" /> : <div className={styles.emptyState}>Current</div>}
                </div>
                <div className={styles.thumbArrow} aria-hidden="true">
                  →
                </div>
                <div className={styles.thumbCard}>
                  {resultUrl ? <img src={resultUrl} alt="Future body preview" /> : <div className={styles.emptyState}>Future</div>}
                </div>
              </div>

              <button type="button" className={styles.primaryButton} onClick={handleGenerate} disabled={!sourceFile || isLoading}>
                {isLoading ? "Calculating..." : "See your potential"}
              </button>

              {error ? <p className={styles.error}>{error}</p> : null}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function MenuGlyph({ active = false }: { active?: boolean }) {
  return (
    <span className={`${styles.menuGlyph} ${active ? styles.menuGlyphActive : ""}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

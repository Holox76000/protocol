"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./upper-body-reel.module.css";
import manImage from "../../man.png";
import bodyScanImage from "../../body-scan.png";
import analysisCardImage from "../../analysis-card.png";
import visualizeResultsImage from "../../visualize-your-results.png";
import upperBodyImage from "../../upper-body-development.png";
import postureImage from "../../posture-frame.png";
import muscleSymmetryImage from "../../muscle-symmetry.png";
import ribCageImage from "../../rib-cage.png";
import coreStrengthImage from "../../core-strength-indicators.png";
import bodyFatImage from "../../body-fat-distribution.png";
import youGainControlImage from "../../you-gain-control.png";
import youGetClarityImage from "../../you-get-clarity.png";

type Scene = {
  id: number;
  label: string;
  title: string;
  duration: number;
};

const SCENES: Scene[] = [
  { id: 1, label: "01", title: "Actor feature", duration: 9 },
  { id: 2, label: "02", title: "Portrait grid", duration: 5.5 },
  { id: 3, label: "03", title: "Stat + citations", duration: 2 },
  { id: 4, label: "04", title: "Proportions vs size", duration: 4 },
  { id: 5, label: "05", title: "Laptop mockup", duration: 7.5 },
  { id: 6, label: "06", title: "AM / PM routine", duration: 4 },
  { id: 7, label: "07", title: "Stacked clips", duration: 7 },
  { id: 8, label: "08", title: "Pivot quote", duration: 5 },
  { id: 9, label: "09", title: "Positive counter-example", duration: 8.5 },
  { id: 10, label: "10", title: "Checklist", duration: 4.5 },
  { id: 11, label: "11", title: "Callout portrait", duration: 5.5 },
  { id: 12, label: "12", title: "Annotated before / after", duration: 3.5 },
  { id: 13, label: "13", title: "App demo", duration: 8 },
  { id: 14, label: "14", title: "Final CTA", duration: 3 },
];

const TOTAL_DURATION = SCENES.reduce((sum, scene) => sum + scene.duration, 0);

const HERO_VARIANTS = [
  { kicker: "Broader shoulders", title: "Build shape, not bulk.", subtitle: "Upper-body attractiveness is mostly silhouette, posture, and shoulder-to-waist contrast." },
  { kicker: "Visible posture", title: "Your frame reads first.", subtitle: "Back width, chest carriage, and neck posture change how every outfit lands." },
  { kicker: "Lean waist", title: "Definition beats raw size.", subtitle: "A tighter waist creates the aesthetic effect people often misread as being more muscular." },
  { kicker: "Face-safe physique", title: "Natural looks win longer.", subtitle: "The goal is a believable frame upgrade, not a steroid look or a bulked silhouette." },
];

const PORTRAITS = [
  manImage.src,
  bodyScanImage.src,
  analysisCardImage.src,
  upperBodyImage.src,
  visualizeResultsImage.src,
  postureImage.src,
  muscleSymmetryImage.src,
  ribCageImage.src,
  coreStrengthImage.src,
  bodyFatImage.src,
  youGainControlImage.src,
  youGetClarityImage.src,
];

const GRID_MESSAGES = [
  "Most men train for size.",
  "Very few train for shape.",
  "That is why most never look better.",
];

const CHECKLIST_ITEMS = [
  "Lift for width, not ego",
  "Keep waist tight year-round",
  "Train upper chest and rear delts",
  "Fix rounded shoulders",
  "Dial grooming and skin",
  "Dress for structure",
  "Repeat for 12 weeks",
];

const CALLOUTS = [
  { label: "Shoulders", text: "Broader clavicle illusion" },
  { label: "Chest", text: "Upper chest priority" },
  { label: "Waist", text: "Tighter visual taper" },
  { label: "Back", text: "Lat flare for width" },
  { label: "Posture", text: "Open rib cage and neck" },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function segment(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function floatStyle(progress: number, offsetY: number, offsetX = 0) {
  const eased = 1 - Math.pow(1 - progress, 3);
  return {
    opacity: eased,
    transform: `translate(${offsetX * (1 - eased)}px, ${offsetY * (1 - eased)}px) scale(${0.94 + eased * 0.06})`,
  };
}

export default function UpperBodyReelExperience() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime((value) => {
        const next = value + delta;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying]);

  const sceneState = useMemo(() => {
    let elapsed = 0;

    for (const scene of SCENES) {
      const end = elapsed + scene.duration;
      if (currentTime <= end || scene.id === SCENES.length) {
        return {
          scene,
          sceneStart: elapsed,
          sceneProgress: clamp((currentTime - elapsed) / scene.duration),
        };
      }
      elapsed = end;
    }

    return {
      scene: SCENES[SCENES.length - 1],
      sceneStart: TOTAL_DURATION - SCENES[SCENES.length - 1].duration,
      sceneProgress: 1,
    };
  }, [currentTime]);

  const overallProgress = currentTime / TOTAL_DURATION;
  const activeSceneIndex = sceneState.scene.id - 1;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.stageSection}>
          <div className={styles.stageHeader}>
            <div>
              <p className={styles.eyebrow}>Upper Body Aesthetics Reel</p>
              <h1 className={styles.title}>Reconstruction HTML / JS / CSS du brief</h1>
            </div>
            <div className={styles.meta}>
              <span>9:16</span>
              <span>77.5s</span>
              <span>14 scenes</span>
            </div>
          </div>

          <div className={styles.stageFrame}>
            <div className={styles.phoneChrome}>
              <div className={styles.statusBar}>
                <span>Protocol</span>
                <span>{sceneState.scene.label}</span>
              </div>
              <div className={styles.videoSurface}>{renderScene(sceneState.scene.id, sceneState.sceneProgress)}</div>
            </div>
          </div>
        </section>

        <aside className={styles.controls}>
          <div className={styles.panel}>
            <p className={styles.panelEyebrow}>Playback</p>
            <h2 className={styles.panelTitle}>
              Scene {sceneState.scene.label} <span>{sceneState.scene.title}</span>
            </h2>
            <p className={styles.panelCopy}>
              Le player rejoue la vidéo complète, et chaque écran suit le timing du brief original.
            </p>

            <div className={styles.buttonRow}>
              <button className={styles.button} onClick={() => setIsPlaying((value) => !value)} type="button">
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                className={styles.buttonGhost}
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                type="button"
              >
                Restart
              </button>
            </div>

            <label className={styles.sliderLabel} htmlFor="timeline">
              Timeline
            </label>
            <input
              id="timeline"
              className={styles.slider}
              max={TOTAL_DURATION}
              min={0}
              onChange={(event) => {
                setCurrentTime(Number(event.target.value));
                lastTimeRef.current = null;
              }}
              step={0.01}
              type="range"
              value={currentTime}
            />
            <div className={styles.timelineMeta}>
              <span>{currentTime.toFixed(1)}s</span>
              <span>{TOTAL_DURATION.toFixed(1)}s</span>
            </div>
          </div>

          <div className={styles.panel}>
            <p className={styles.panelEyebrow}>Storyboard</p>
            <div className={styles.sceneList}>
              {SCENES.map((scene, index) => {
                const isActive = index === activeSceneIndex;
                return (
                  <button
                    key={scene.id}
                    className={`${styles.sceneItem} ${isActive ? styles.sceneItemActive : ""}`}
                    onClick={() => {
                      const time = SCENES.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
                      setCurrentTime(time);
                      lastTimeRef.current = null;
                    }}
                    type="button"
                  >
                    <span>{scene.label}</span>
                    <strong>{scene.title}</strong>
                    <small>{scene.duration.toFixed(1)}s</small>
                  </button>
                );
              })}
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${overallProgress * 100}%` }} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function renderScene(sceneId: number, progress: number) {
  switch (sceneId) {
    case 1: {
      const activeIndex = Math.min(HERO_VARIANTS.length - 1, Math.floor(progress * HERO_VARIANTS.length));
      const active = HERO_VARIANTS[activeIndex];
      return (
        <div className={`${styles.scene} ${styles.sceneHero}`}>
          <div className={styles.heroGlow} />
          <img alt="" className={styles.heroFigure} src={manImage.src} />
          <div className={styles.heroCard} style={floatStyle(segment(progress, 0, 0.24), 30)}>
            <p>{active.kicker}</p>
            <h2>{active.title}</h2>
            <span>{active.subtitle}</span>
          </div>
          <div className={styles.heroRail}>
            {HERO_VARIANTS.map((item, index) => (
              <div key={item.title} className={`${styles.heroMiniCard} ${index === activeIndex ? styles.heroMiniCardActive : ""}`}>
                <strong>{item.kicker}</strong>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 2: {
      const textIndex = Math.min(GRID_MESSAGES.length - 1, Math.floor(progress * GRID_MESSAGES.length));
      return (
        <div className={`${styles.scene} ${styles.sceneGrid}`}>
          <div className={styles.portraitGrid}>
            {PORTRAITS.map((portrait, index) => (
              <div
                key={`${portrait}-${index}`}
                className={styles.portraitBubble}
                style={{
                  ...floatStyle(segment(progress, index * 0.03, 0.45 + index * 0.02), 18),
                  transitionDelay: `${index * 30}ms`,
                }}
              >
                <img alt="" src={portrait} />
              </div>
            ))}
          </div>
          <div className={styles.gridMessage}>
            <p>Upper-body narrative</p>
            <h2>{GRID_MESSAGES[textIndex]}</h2>
          </div>
        </div>
      );
    }
    case 3:
      return (
        <div className={`${styles.scene} ${styles.sceneStat}`}>
          <div className={styles.videoBackdrop}>
            <img alt="" src={youGetClarityImage.src} />
          </div>
          <div className={styles.statOverlay} style={floatStyle(segment(progress, 0, 0.35), 20)}>
            <p>Peer-reviewed signal</p>
            <h2>Shoulder-to-waist ratio beats raw muscle mass.</h2>
          </div>
          <div className={styles.citationStack}>
            <div className={styles.citation}>Upper-body proportions consistently predict perceived attractiveness.</div>
            <div className={styles.citation}>Women rate shape and taper above indiscriminate bulk.</div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className={`${styles.scene} ${styles.sceneCompare}`}>
          <h2>Proportions vs. muscle mass</h2>
          <div className={styles.compareRow}>
            <div className={styles.compareCard}>
              <img alt="" src={upperBodyImage.src} />
              <span>Lean taper</span>
            </div>
            <div className={styles.compareArrow}>›</div>
            <div className={styles.compareCard}>
              <img alt="" src={bodyFatImage.src} />
              <span>Bulky silhouette</span>
            </div>
          </div>
          <div className={styles.compareFootnote}>Women would rather see a man&apos;s proportions than his size to rate his attractiveness.</div>
        </div>
      );
    case 5:
      return (
        <div className={`${styles.scene} ${styles.sceneLaptop}`}>
          <div className={styles.laptopShell}>
            <div className={styles.laptopScreen}>
              <div className={styles.splitClip}>
                <div className={styles.clipPanel}>
                  <img alt="" src={youGainControlImage.src} />
                  <span>Wrong approach</span>
                </div>
                <div className={styles.clipPanel}>
                  <img alt="" src={analysisCardImage.src} />
                  <span>More effort, same silhouette</span>
                </div>
              </div>
            </div>
            <div className={styles.laptopBase} />
          </div>
          <div className={styles.laptopCaption}>Most guys spend years adding effort without changing the visual frame.</div>
        </div>
      );
    case 6:
      return (
        <div className={`${styles.scene} ${styles.sceneRoutine}`}>
          <div className={styles.routineColumn}>
            <p>AM</p>
            <ul>
              <li>Wall angels and face pulls</li>
              <li>Shoulder mobility sequence</li>
              <li>SPF + clean skin finish</li>
              <li>Structured shirt and compression fit</li>
            </ul>
          </div>
          <div className={styles.routineDivider} />
          <div className={styles.routineColumn}>
            <p>PM</p>
            <ul>
              <li>Upper chest and lateral delts</li>
              <li>Waist-friendly nutrition</li>
              <li>Stretch lats and hip flexors</li>
              <li>Sleep posture and recovery</li>
            </ul>
          </div>
        </div>
      );
    case 7: {
      const tagProgress = CALLOUTS.map((_, index) => segment(progress, 0.12 + index * 0.12, 0.28 + index * 0.12));
      return (
        <div className={`${styles.scene} ${styles.sceneStacked}`}>
          <div className={styles.stackedMedia}>
            <img alt="" src={bodyScanImage.src} />
            <img alt="" src={visualizeResultsImage.src} />
          </div>
          {CALLOUTS.slice(0, 4).map((callout, index) => (
            <div
              key={callout.label}
              className={styles.tag}
              style={{
                ...floatStyle(tagProgress[index], 20),
                top: `${18 + index * 14}%`,
                left: index % 2 === 0 ? "8%" : "54%",
              }}
            >
              <strong>{callout.label}</strong>
              <span>{callout.text}</span>
            </div>
          ))}
        </div>
      );
    }
    case 8:
      return (
        <div className={`${styles.scene} ${styles.sceneQuote}`}>
          <p>Pivot message</p>
          <blockquote>Men keep chasing size because nobody taught them how aesthetics actually work.</blockquote>
        </div>
      );
    case 9:
      return (
        <div className={`${styles.scene} ${styles.sceneWomen}`}>
          <div className={styles.twoUp}>
            <div className={styles.softCard}>
              <img alt="" src={youGetClarityImage.src} />
              <span>Fitness</span>
            </div>
            <div className={styles.softCard}>
              <img alt="" src={youGainControlImage.src} />
              <span>Skincare</span>
            </div>
          </div>
          <h2>Women already understand the stack: physique, grooming, consistency.</h2>
        </div>
      );
    case 10:
      return (
        <div className={`${styles.scene} ${styles.sceneChecklist}`}>
          <p>Hard but simple:</p>
          <ul>
            {CHECKLIST_ITEMS.map((item, index) => (
              <li key={item} style={floatStyle(segment(progress, index * 0.08, 0.32 + index * 0.08), 14)}>
                <span>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      );
    case 11:
      return (
        <div className={`${styles.scene} ${styles.scenePortrait}`}>
          <img alt="" className={styles.subjectPortrait} src={manImage.src} />
          {CALLOUTS.map((callout, index) => (
            <div
              key={callout.label}
              className={styles.callout}
              style={{
                ...floatStyle(segment(progress, 0.06 + index * 0.1, 0.24 + index * 0.1), 16),
                top: `${12 + index * 15}%`,
                left: index % 2 === 0 ? "2%" : "58%",
              }}
            >
              <strong>{callout.label}</strong>
              <span>{callout.text}</span>
            </div>
          ))}
        </div>
      );
    case 12:
      return (
        <div className={`${styles.scene} ${styles.sceneBeforeAfter}`}>
          <div className={styles.beforeAfterFrame}>
            <div className={styles.beforePane}>
              <img alt="" src={bodyFatImage.src} />
              <span>Before</span>
            </div>
            <div className={styles.afterPane}>
              <img alt="" src={upperBodyImage.src} />
              <span>After</span>
            </div>
          </div>
          <div className={styles.annotationRail}>
            <span>Better taper</span>
            <span>Improved posture</span>
            <span>More upper-chest visibility</span>
          </div>
        </div>
      );
    case 13: {
      const panelIndex = Math.min(2, Math.floor(progress * 3));
      return (
        <div className={`${styles.scene} ${styles.sceneApp}`}>
          <div className={styles.appBrand}>TF</div>
          <div className={styles.appPhone}>
            <div className={styles.appHeader}>
              <span>{panelIndex + 1}. {panelIndex === 0 ? "Body Analysis" : panelIndex === 1 ? "Projection" : "Protocol"}</span>
            </div>
            {panelIndex === 0 ? (
              <div className={styles.appPanel}>
                <img alt="" className={styles.appSubject} src={analysisCardImage.src} />
                <div className={styles.metric}><span>Shoulders</span><div><i style={{ width: "78%" }} /></div></div>
                <div className={styles.metric}><span>Waist</span><div><i style={{ width: "38%" }} /></div></div>
                <div className={styles.metric}><span>Posture</span><div><i style={{ width: "61%" }} /></div></div>
              </div>
            ) : null}
            {panelIndex === 1 ? (
              <div className={styles.appPanel}>
                <div className={styles.projectionCard}>
                  <img alt="" src={bodyScanImage.src} />
                  <img alt="" src={visualizeResultsImage.src} />
                </div>
                <div className={styles.scoreCard}>
                  <strong>68</strong>
                  <span>Higher than 60% of your age group</span>
                </div>
              </div>
            ) : null}
            {panelIndex === 2 ? (
              <div className={styles.appPanel}>
                <h3>Alex&apos;s Protocol</h3>
                <ul className={styles.tipList}>
                  <li>Prioritize rear delts and upper chest</li>
                  <li>Keep waist neutral while gaining</li>
                  <li>Fix rib cage and neck posture daily</li>
                </ul>
                <div className={styles.zoneRow}>
                  <span>Shoulders</span>
                  <span>Back</span>
                  <span>Waist</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    case 14: {
      const domain = "timeframe.app";
      const charCount = Math.max(1, Math.floor(progress * domain.length));
      return (
        <div className={`${styles.scene} ${styles.sceneCta}`}>
          <div className={styles.searchBar}>
            <span>{domain.slice(0, charCount)}</span>
            <b>⌕</b>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

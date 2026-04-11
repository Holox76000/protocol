"use client";

import { useState } from "react";
import ScanReport from "./ScanReport";

const SUBJECTS = [
  { id: "1", label: "Subject 1" },
  { id: "2", label: "Subject 2" },
  { id: "3", label: "Subject 3" },
  { id: "4", label: "Subject 4" },
  { id: "5", label: "Subject 5" },
  { id: "6", label: "Subject 6" },
  { id: "7", label: "Subject 7" },
  { id: "8", label: "Subject 8" },
  { id: "9", label: "Subject 9" },
  { id: "10", label: "Subject 10" },
  { id: "14", label: "Subject 14" },
  { id: "15", label: "Subject 15" },
  { id: "16", label: "Subject 16" },
  { id: "17", label: "Subject 17" },
  { id: "18", label: "Subject 18" },
  { id: "19", label: "Subject 19" },
  { id: "woman-1", label: "Woman 1" },
  { id: "woman-2", label: "Woman 2" },
];

/** Shared metric definitions (values are computed from points, these are just the base structure) */
const BASE_METRICS = {
  swr: { value: 1.34, unit: "", label: "Shoulder-to-Waist Ratio", abbr: "SWR", recommended: { min: 1.61, max: 1.68 }, source: "Tovée & Cornelissen (2001), Proceedings of the Royal Society B" },
  cwr: { value: 1.18, unit: "", label: "Chest-to-Waist Ratio", abbr: "CWR", recommended: { min: 1.35, max: 1.45 }, source: "Swami & Tovée (2005), Body Image; Fan et al. (2004), Proceedings of the Royal Society B" },
  bf: { value: 24, unit: "%", label: "Body Fat Estimate", abbr: "BF%", recommended: { min: 10, max: 15 }, source: "Lassek & Gaulin (2009), Evolution and Human Behavior" },
  pas: { value: 61, unit: "/100", label: "Posture Alignment Score", abbr: "PAS", recommended: { min: 80, max: 95 }, source: "Carney, Cuddy & Yap (2010), Psychological Science" },
  ti: { value: 0.82, unit: "", label: "Taper Index", abbr: "TI", recommended: { min: 1.1, max: 1.5 }, source: "Hughes & Gallup (2003), Evolutionary Psychology" },
  pc: { value: 44, unit: "/100", label: "Proportion Coherence", abbr: "PC", recommended: { min: 75, max: 95 }, source: "Protocol Club proprietary metric" },
};

/** Default overlay positions — centered, will be adjusted by user per subject */
const DEFAULT_OVERLAYS = {
  shoulderLeft: { x: 24, y: 30 },
  shoulderRight: { x: 76, y: 30 },
  chestLeft: { x: 27, y: 38 },
  chestRight: { x: 73, y: 38 },
  waistLeft: { x: 32, y: 52 },
  waistRight: { x: 68, y: 52 },
  postureTop: { x: 50, y: 10 },
  postureBottom: { x: 51, y: 58 },
};

export default function ScanPage() {
  const [subjectId, setSubjectId] = useState("2");

  const beforeImage = {
    src: `/assets/${subjectId}-before.png`,
    alt: `Subject ${subjectId} — current state`,
  };

  const afterImage = {
    src: `/assets/${subjectId}-after.png`,
    alt: `Subject ${subjectId} — target state`,
  };

  const subjectPicker = (
    <div className="scan-subject-picker">
      <label htmlFor="scan-subject-select" className="scan-subject-picker__label">
        Subject
      </label>
      <select
        id="scan-subject-select"
        className="scan-subject-picker__select"
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
      >
        {SUBJECTS.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <ScanReport
      key={subjectId}
      beforeImage={beforeImage}
      afterImage={afterImage}
      metricsBefore={BASE_METRICS}
      metricsAfter={BASE_METRICS}
      overlaysBefore={DEFAULT_OVERLAYS}
      overlaysAfter={DEFAULT_OVERLAYS}
      subjectName={`Subject ${subjectId}`}
      subjectAge={30}
      extraControls={subjectPicker}
    />
  );
}

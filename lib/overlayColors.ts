// Shared overlay colour palette — clinical tones derived from the Protocol Club slate/green palette.
// Used by PhotoCalibrator.tsx (admin), BodyAnalysis.tsx and ProtocolSidebarLayout.tsx (protocol).

export const OC = {
  shoulder: { line: "rgba(134,195,158,1)", faint: "rgba(134,195,158,0.10)", guide: "rgba(134,195,158,0.07)" },
  chest:    { line: "rgba(162,172,215,1)", faint: "rgba(162,172,215,0.10)", guide: "rgba(162,172,215,0.07)" },
  waist:    { line: "rgba(210,182,118,1)", faint: "rgba(210,182,118,0.10)", guide: "rgba(210,182,118,0.07)" },
  posture:  { line: "rgba(128,168,208,1)", faint: "rgba(128,168,208,0.10)", guide: "rgba(128,168,208,0.07)" },
} as const;

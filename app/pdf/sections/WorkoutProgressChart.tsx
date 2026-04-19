import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { C, F } from "../pdfTheme";

type Props = {
  currentScore:    number;
  sessionsPerWeek: number;
  pps:             number;
};

const WEEKS = 12;
const CHART_H = 52;

function barFill(i: number, score: number): string {
  if (score >= 99.5) return C.accent;
  if (i < 4)  return "#253239";
  if (i < 8)  return "#2d4a3e";
  return "#3a6652";
}

// Labels shown below the chart — month markers + start
const LABELS: Record<number, string> = {
  0:  "Start",
  3:  "M1",
  7:  "M2",
  11: "M3",
};

export function WorkoutProgressChart({ currentScore, sessionsPerWeek, pps }: Props) {
  const weeklyGain = sessionsPerWeek * pps;
  const scores = Array.from({ length: WEEKS }, (_, i) =>
    Math.min(100, currentScore + weeklyGain * (i + 1))
  );
  const range = Math.max(1, 100 - currentScore);

  return (
    <View style={{ marginBottom: 16, flexDirection: "row", alignItems: "stretch", gap: 6 }}>
      {/* Y-axis labels */}
      <View style={{ justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 14 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 5.5, color: C.accent, fontWeight: 600 }}>100</Text>
        <Text style={{ fontFamily: F.mono, fontSize: 5.5, color: C.mute }}>{currentScore}</Text>
      </View>

      {/* Bars + labels */}
      <View style={{ flex: 1 }}>
        {/* Bars */}
        <View style={{ flexDirection: "row", height: CHART_H, alignItems: "flex-end", gap: 3 }}>
          {scores.map((score, i) => {
            const h = Math.max(2, ((score - currentScore) / range) * CHART_H);
            return (
              <View
                key={i}
                style={{ flex: 1, height: h, backgroundColor: barFill(i, score), borderRadius: 1.5 }}
              />
            );
          })}
        </View>

        {/* X-axis month labels */}
        <View style={{ flexDirection: "row", marginTop: 4, gap: 3 }}>
          {scores.map((_, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              {LABELS[i] !== undefined && (
                <Text style={{ fontFamily: F.mono, fontSize: 5, color: C.mute, letterSpacing: 0.3 }}>
                  {LABELS[i]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

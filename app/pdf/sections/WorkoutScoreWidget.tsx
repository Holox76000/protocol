import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type Props = {
  score:           number; // 0–100 current attractiveness score
  sessionsPerWeek: number;
};

export function WorkoutScoreWidget({ score, sessionsPerWeek }: Props) {
  const needed = 100 - score;
  const total  = sessionsPerWeek * 12;
  const pps    = needed / total;

  // Clamp for flex-based progress bar (flex:0 crashes yoga)
  const fill = Math.max(1, Math.min(99, score));
  const gap  = 100 - fill;

  return (
    <View style={{
      backgroundColor: C.coverBg,
      borderRadius: 10,
      padding: "14pt 18pt",
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    }}>
      {/* Left — big number */}
      <View style={{ width: 110, paddingRight: 12 }}>
        <Text style={{
          fontFamily: F.mono, fontSize: 7, color: C.accent,
          letterSpacing: 2, textTransform: "uppercase", marginBottom: 4,
        }}>
          Par séance
        </Text>
        <Text style={{
          fontFamily: F.sans, fontSize: 28, fontWeight: 600,
          color: C.white, lineHeight: 1,
        }}>
          +{pps.toFixed(2)}
        </Text>
        <Text style={{ fontFamily: F.sans, fontSize: 8, color: C.mute, marginTop: 3 }}>
          pts attractivité
        </Text>
      </View>

      {/* Vertical divider */}
      <View style={{ width: 1, height: 44, backgroundColor: "#2a3d44", marginRight: 16 }} />

      {/* Right — progress + breakdown */}
      <View style={{ flex: 1 }}>
        {/* Progress bar via flex ratio */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 }}>
          <View style={{ flex: 1, height: 5, backgroundColor: "#2a3d44", borderRadius: 3, flexDirection: "row", overflow: "hidden" }}>
            <View style={{ flex: fill, height: 5, backgroundColor: C.accent }} />
            <View style={{ flex: gap,  height: 5 }} />
          </View>
          <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.accent }}>
            {score}/100
          </Text>
        </View>
        <Text style={{ fontFamily: F.sans, fontSize: 8, color: C.dim }}>
          {needed} pts to reach 100 · {sessionsPerWeek}x/wk · 12 weeks · {total} sessions
        </Text>
      </View>
    </View>
  );
}

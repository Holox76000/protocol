import { View, Text } from "@react-pdf/renderer";
import type { CalibrationMetrics } from "../../../app/admin/orders/[userId]/PhotoCalibrator";
import { getAgeRanges } from "../../../lib/attractivenessScore";
import { C, F } from "../pdfTheme";

type Def = {
  key:   keyof CalibrationMetrics;
  abbr:  string;
  label: string;
  fmt:   (v: number) => string;
};

const DEFS: Def[] = [
  { key: "swr", abbr: "SWR", label: "Shoulder-Waist",  fmt: v => v.toFixed(2) },
  { key: "cwr", abbr: "CWR", label: "Chest-Waist",     fmt: v => v.toFixed(2) },
  { key: "bf",  abbr: "BF%", label: "Body Fat",        fmt: v => `${v}%` },
  { key: "pas", abbr: "PAS", label: "Posture",          fmt: v => String(v) },
  { key: "ti",  abbr: "TI",  label: "Taper Index",      fmt: v => v.toFixed(2) },
  { key: "pc",  abbr: "PC",  label: "Proportion",       fmt: v => String(v) },
];

function chipStatus(key: keyof CalibrationMetrics, value: number, age?: number): "good" | "warn" | "bad" {
  const ranges = age != null ? getAgeRanges(age) : {
    swr: [1.41, 1.63] as [number, number],
    cwr: [1.25, 1.35] as [number, number],
    bf:  [10,   17  ] as [number, number],
    pas: [80,   95  ] as [number, number],
    ti:  [1.1,  1.5 ] as [number, number],
    pc:  [75,   95  ] as [number, number],
  };
  const [min, max] = ranges[key];
  if (key === "bf") {
    if (value >= min && value <= max) return "good";
    return value <= max + 4 ? "warn" : "bad";
  }
  if (value >= min && value <= max) return "good";
  const gap = Math.min(Math.abs(value - min), Math.abs(value - max));
  return gap < (max - min) * 0.8 ? "warn" : "bad";
}

const STATUS_COLORS = {
  good: { bg: "#f0faf4", border: "#b5dfc5", text: "#2e6e4a", label: "#4a7c59" },
  warn: { bg: "#fffbf0", border: "#f0d89a", text: "#7a5a18", label: "#8a7230" },
  bad:  { bg: "#fff4f4", border: "#f0aaaa", text: "#7a2828", label: "#8a3030" },
};

export function MetricsGrid({ metrics, age }: { metrics: CalibrationMetrics; age?: number }) {
  return (
    <View style={{
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    }}>
      {DEFS.map(def => {
        const value  = metrics[def.key];
        const status = chipStatus(def.key, value, age);
        const col    = STATUS_COLORS[status];

        return (
          <View key={def.key} style={{
            width: "30%",
            borderWidth: 1,
            borderColor: col.border,
            borderRadius: 8,
            backgroundColor: col.bg,
            padding: "8pt 10pt",
          }}>
            <Text style={{
              fontFamily: F.mono,
              fontSize: 7,
              color: col.label,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 4,
            }}>
              {def.abbr}
            </Text>
            <Text style={{
              fontFamily: F.sans,
              fontSize: 18,
              fontWeight: 600,
              color: col.text,
              lineHeight: 1,
              marginBottom: 3,
            }}>
              {def.fmt(value)}
            </Text>
            <Text style={{
              fontFamily: F.sans,
              fontSize: 8,
              color: col.label,
              opacity: 0.8,
            }}>
              {def.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

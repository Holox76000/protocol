import type { CalibrationMetrics } from "../app/admin/orders/[userId]/PhotoCalibrator";

export const METRIC_DEFS: Record<
  keyof CalibrationMetrics,
  { abbr: string; name: string }
> = {
  swr: { abbr: "SWR", name: "Shoulder-to-Waist Ratio" },
  cwr: { abbr: "CWR", name: "Chest-to-Waist Ratio" },
  bf:  { abbr: "BF%", name: "Body Fat Percentage" },
  pas: { abbr: "PAS", name: "Posture Alignment Score" },
  ti:  { abbr: "TI",  name: "Taper Index" },
  pc:  { abbr: "PC",  name: "Proportional Composite" },
};

import React from "react";
import { View, Image, Svg, Line, Circle, Text, G } from "@react-pdf/renderer";
import type { OverlayPoints, CalibrationMetrics } from "../../admin/orders/[userId]/PhotoCalibrator";
import { C, F } from "../pdfTheme";

// Hex equivalents of the OC palette (react-pdf SVG doesn't support rgba())
const OCP = {
  shoulder: "#86c39e",
  chest:    "#a2acd7",
  waist:    "#d2b676",
  posture:  "#80a8d0",
};

// Display dimensions — 3:4 portrait, matching the admin calibrator's aspectRatio
const PHOTO_W = 240;
const PHOTO_H = 320;

type Props = {
  photoDataUri:  string | null;
  overlayPoints: OverlayPoints | null;
  metrics:       CalibrationMetrics | null;
};

export function AnnotatedPhotoSection({ photoDataUri, overlayPoints, metrics }: Props) {
  if (!photoDataUri || !overlayPoints || !metrics) return null;

  const pts = overlayPoints;

  const shoulderY = (pts.shoulderLeft.y  + pts.shoulderRight.y) / 2;
  const chestY    = (pts.chestLeft.y     + pts.chestRight.y)    / 2;
  const waistY    = (pts.waistLeft.y     + pts.waistRight.y)    / 2;

  const { postureTop: ptTop, postureBottom: ptBot } = pts;
  const postureMidX = (ptTop.x + ptBot.x) / 2;
  const postureMidY = (ptTop.y + ptBot.y) / 2;
  const postureMaxX = Math.max(ptTop.x, ptBot.x);

  return (
    <View style={{ alignSelf: "center", marginTop: 8, marginBottom: 20 }}>
      {/* Section label */}
      <Text style={{
        fontFamily: F.mono,
        fontSize: 7,
        color: C.mute,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        Calibration
      </Text>

      {/* Photo + overlay container */}
      <View style={{ width: PHOTO_W, height: PHOTO_H, backgroundColor: C.ash, overflow: "hidden" }}>

        {/* Base photo */}
        <Image
          src={photoDataUri}
          style={{
            width: PHOTO_W,
            height: PHOTO_H,
            objectFit: "cover",
            objectPosition: "top center",
          }}
        />

        {/* SVG overlay — absolutely positioned on top of the photo */}
        <View style={{ position: "absolute", top: 0, left: 0, width: PHOTO_W, height: PHOTO_H }}>
          {/*
            viewBox "0 0 100 100" matches the web calibrator (preserveAspectRatio: none).
            Coordinates are the same percentages stored in overlay_points.
          */}
          <Svg width={PHOTO_W} height={PHOTO_H} viewBox="0 0 100 100">

            {/* ── Full-width guide lines (faint) ── */}
            <Line x1={0} y1={shoulderY} x2={100} y2={shoulderY} stroke={OCP.shoulder} strokeWidth={0.3} strokeOpacity={0.35} />
            <Line x1={0} y1={chestY}    x2={100} y2={chestY}    stroke={OCP.chest}    strokeWidth={0.3} strokeOpacity={0.35} />
            <Line x1={0} y1={waistY}    x2={100} y2={waistY}    stroke={OCP.waist}    strokeWidth={0.3} strokeOpacity={0.35} />

            {/* ── Taper silhouette (shoulder corners → waist corners) ── */}
            <Line x1={pts.shoulderLeft.x}  y1={shoulderY} x2={pts.waistLeft.x}  y2={waistY} stroke={OCP.shoulder} strokeWidth={0.3} strokeOpacity={0.35} strokeDasharray="1.5 1" />
            <Line x1={pts.shoulderRight.x} y1={shoulderY} x2={pts.waistRight.x} y2={waistY} stroke={OCP.shoulder} strokeWidth={0.3} strokeOpacity={0.35} strokeDasharray="1.5 1" />

            {/* ── Shoulder band ── */}
            <Line x1={pts.shoulderLeft.x}  y1={shoulderY} x2={pts.shoulderRight.x} y2={shoulderY} stroke={OCP.shoulder} strokeWidth={0.6} />
            <Line x1={pts.shoulderLeft.x}  y1={shoulderY - 3.5} x2={pts.shoulderLeft.x}  y2={shoulderY + 3.5} stroke={OCP.shoulder} strokeWidth={0.9} strokeLinecap="round" />
            <Line x1={pts.shoulderRight.x} y1={shoulderY - 3.5} x2={pts.shoulderRight.x} y2={shoulderY + 3.5} stroke={OCP.shoulder} strokeWidth={0.9} strokeLinecap="round" />
            <Text x={pts.shoulderRight.x + 2} y={shoulderY - 1} style={{ fontSize: 2.5, fontWeight: 600, fill: OCP.shoulder }}>
              SWR {metrics.swr.toFixed(2)}
            </Text>

            {/* ── Chest band ── */}
            <Line x1={pts.chestLeft.x}  y1={chestY} x2={pts.chestRight.x} y2={chestY} stroke={OCP.chest} strokeWidth={0.6} />
            <Line x1={pts.chestLeft.x}  y1={chestY - 3.5} x2={pts.chestLeft.x}  y2={chestY + 3.5} stroke={OCP.chest} strokeWidth={0.9} strokeLinecap="round" />
            <Line x1={pts.chestRight.x} y1={chestY - 3.5} x2={pts.chestRight.x} y2={chestY + 3.5} stroke={OCP.chest} strokeWidth={0.9} strokeLinecap="round" />
            <Text x={pts.chestRight.x + 2} y={chestY - 1} style={{ fontSize: 2.5, fontWeight: 600, fill: OCP.chest }}>
              CWR {metrics.cwr.toFixed(2)}
            </Text>

            {/* ── Waist band ── */}
            <Line x1={pts.waistLeft.x}  y1={waistY} x2={pts.waistRight.x} y2={waistY} stroke={OCP.waist} strokeWidth={0.6} />
            <Line x1={pts.waistLeft.x}  y1={waistY - 3.5} x2={pts.waistLeft.x}  y2={waistY + 3.5} stroke={OCP.waist} strokeWidth={0.9} strokeLinecap="round" />
            <Line x1={pts.waistRight.x} y1={waistY - 3.5} x2={pts.waistRight.x} y2={waistY + 3.5} stroke={OCP.waist} strokeWidth={0.9} strokeLinecap="round" />
            <Text x={pts.waistRight.x + 2} y={waistY - 1} style={{ fontSize: 2.5, fontWeight: 600, fill: OCP.waist }}>
              TI {metrics.ti.toFixed(2)}
            </Text>

            {/* ── Posture axis ── */}
            <G>
              {/* Ideal plumb line */}
              <Line x1={postureMidX} y1={ptTop.y} x2={postureMidX} y2={ptBot.y} stroke={OCP.posture} strokeWidth={0.3} strokeOpacity={0.4} strokeDasharray="2 2" />
              {/* Actual axis */}
              <Line x1={ptTop.x} y1={ptTop.y} x2={ptBot.x} y2={ptBot.y} stroke={OCP.posture} strokeWidth={0.6} strokeDasharray="2 1.5" />
              {/* Endpoint dots */}
              <Circle cx={ptTop.x} cy={ptTop.y} r={1.4} fill={OCP.posture} fillOpacity={0.3} stroke={OCP.posture} strokeWidth={0.4} />
              <Circle cx={ptBot.x} cy={ptBot.y} r={1.4} fill={OCP.posture} fillOpacity={0.3} stroke={OCP.posture} strokeWidth={0.4} />
              <Text x={postureMaxX + 2.5} y={postureMidY + 1} style={{ fontSize: 2.5, fontWeight: 600, fill: OCP.posture }}>
                PAS {metrics.pas}
              </Text>
            </G>

          </Svg>
        </View>
      </View>

      {/* Bottom rule */}
      <View style={{ height: 1, backgroundColor: C.wire, marginTop: 8 }} />
    </View>
  );
}

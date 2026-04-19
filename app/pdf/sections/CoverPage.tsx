import React from "react";
import { Page, View, Text, Image, Svg, Circle, G, Line } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type Props = {
  firstName:     string;
  deliveredDate: string | null;
  score:         number;
  scoreLabel:    string;
  photoDataUri:  string | null;
};

function ScoreRing({ score, label }: { score: number; label: string }) {
  const R   = 44;
  const sw  = 5;
  const cx  = 56;
  const cy  = 56;
  const C2     = 2 * Math.PI * R;
  // Clamp so neither segment of strokeDasharray is 0 — PDFKit rejects 0-length dashes.
  const clampedScore = Math.max(1, Math.min(99, score));
  const arc    = C2 * (clampedScore / 100);
  const gap    = C2 - arc;

  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      {/* Track */}
      <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#2a3d44" strokeWidth={sw} />
      {/* Arc */}
      <Circle
        cx={cx} cy={cy} r={R}
        fill="none"
        stroke={C.accent}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${arc.toFixed(2)} ${gap.toFixed(2)}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Score text */}
      <G>
        <Text
          style={{
            fontSize: 22,
            fontFamily: F.sans,
            fontWeight: 600,
            fill: C.white,
            textAnchor: "middle",
          }}
          x={cx}
          y={cy - 4}
        >
          {score}
        </Text>
        <Text
          style={{
            fontSize: 8,
            fontFamily: F.sans,
            fontWeight: 400,
            fill: C.mute,
            textAnchor: "middle",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
          x={cx}
          y={cy + 12}
        >
          {label}
        </Text>
      </G>
    </Svg>
  );
}

export function CoverPage({ firstName, deliveredDate, score, scoreLabel, photoDataUri }: Props) {
  return (
    <Page
      size="A4"
      style={{ backgroundColor: C.coverBg, flexDirection: "row" }}
    >
      {/* Left column */}
      <View style={{
        flex: 1,
        paddingLeft: PAGE.marginX,
        paddingRight: 24,
        paddingTop: PAGE.marginY,
        paddingBottom: PAGE.marginY,
        justifyContent: "space-between",
      }}>
        {/* Wordmark */}
        <View>
          <Text style={{
            fontFamily: F.mono,
            fontSize: 9,
            letterSpacing: 3,
            color: "#4a6875",
            textTransform: "uppercase",
            marginBottom: 48,
          }}>
            PROTOCOL
          </Text>

          {/* Name */}
          <Text style={{
            fontFamily: F.serif,
            fontSize: 40,
            fontStyle: "italic",
            color: C.white,
            lineHeight: 1.15,
            marginBottom: 8,
          }}>
            {firstName}
          </Text>
          <Text style={{
            fontFamily: F.sans,
            fontSize: 12,
            color: C.mute,
            marginBottom: 40,
          }}>
            Personal Protocol
          </Text>

          {/* Score ring */}
          <ScoreRing score={score} label={scoreLabel} />
        </View>

        {/* Footer */}
        <View>
          {deliveredDate && (
            <Text style={{
              fontFamily: F.mono,
              fontSize: 8,
              color: "#4a6875",
              letterSpacing: 1,
              marginBottom: 4,
            }}>
              {deliveredDate.toUpperCase()}
            </Text>
          )}
          <Text style={{
            fontFamily: F.mono,
            fontSize: 8,
            color: "#354a53",
            letterSpacing: 1,
          }}>
            CONFIDENTIAL
          </Text>
        </View>
      </View>

      {/* Right column — photo */}
      {photoDataUri && (
        <View style={{
          width: 220,
          paddingTop: 0,
          paddingBottom: 0,
          overflow: "hidden",
        }}>
          <Image
            src={photoDataUri}
            style={{
              width: 220,
              height: PAGE.height,
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
          {/* Dark edge strip to blend with left column — react-pdf has no gradient support */}
          <View style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 16,
            height: PAGE.height,
            backgroundColor: C.coverBg,
            opacity: 0.8,
          }} />
        </View>
      )}
    </Page>
  );
}

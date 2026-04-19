import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type TocEntry = { label: string; category: string };

type Props = {
  entries: TocEntry[];
  firstName: string;
};

export function TocPage({ entries, firstName }: Props) {
  return (
    <Page size="A4" style={{ backgroundColor: C.white, padding: `${PAGE.marginY}pt ${PAGE.marginX}pt` }}>
      {/* Eyebrow */}
      <Text style={{
        fontFamily: F.mono,
        fontSize: 8,
        color: C.mute,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {firstName} · Contents
      </Text>

      {/* Title */}
      <Text style={{
        fontFamily: F.serif,
        fontStyle: "italic",
        fontSize: 28,
        color: C.void,
        marginBottom: 36,
        borderBottomWidth: 1,
        borderBottomColor: C.wire,
        paddingBottom: 20,
      }}>
        Your Protocol.
      </Text>

      {/* Entries */}
      <View style={{ gap: 0 }}>
        {entries.map((entry, i) => (
          <View
            key={entry.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.wire,
            }}
          >
            {/* Number */}
            <Text style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: C.mute,
              width: 24,
            }}>
              {String(i + 1).padStart(2, "0")}
            </Text>

            {/* Label */}
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: F.sans,
                fontSize: 13,
                fontWeight: 500,
                color: C.void,
                marginBottom: 2,
              }}>
                {entry.label}
              </Text>
              <Text style={{
                fontFamily: F.mono,
                fontSize: 8,
                color: C.mute,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}>
                {entry.category}
              </Text>
            </View>

            {/* Accent dash */}
            <View style={{
              width: 16,
              height: 2,
              backgroundColor: C.accent,
              opacity: 0.4,
            }} />
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{
        position: "absolute",
        bottom: PAGE.marginY,
        left: PAGE.marginX,
        right: PAGE.marginX,
        flexDirection: "row",
        justifyContent: "space-between",
      }}>
        <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1 }}>
          PROTOCOL · CONFIDENTIAL
        </Text>
        <Text
          style={{ fontFamily: F.mono, fontSize: 7, color: C.mute }}
          render={({ pageNumber }) => `${pageNumber}`}
        />
      </View>
    </Page>
  );
}

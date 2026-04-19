import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

type Props = {
  sectionLabel:  string;
  categoryLabel: string;
  firstName:     string;
  children:      React.ReactNode;
};

export function SectionPage({ sectionLabel, categoryLabel, firstName, children }: Props) {
  const [word1, ...rest] = sectionLabel.split(" ");
  const word2 = rest.join(" ");

  return (
    <Page
      size="A4"
      style={{
        backgroundColor: C.white,
        paddingTop: PAGE.marginY,
        paddingBottom: PAGE.marginY + 20,
        paddingLeft: PAGE.marginX,
        paddingRight: PAGE.marginX,
      }}
    >
      {/* Accent top stripe */}
      <View style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: C.accent,
      }} />

      {/* Topbar breadcrumb */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
        marginTop: 4,
      }}>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: C.mute,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}>
          Protocol · {firstName} · {sectionLabel}
        </Text>
      </View>

      {/* Hero heading */}
      <View style={{ marginBottom: 28, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.wire }}>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: C.mute,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 10,
        }}>
          Protocol · {categoryLabel}
        </Text>
        <Text style={{
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: 30,
          color: C.void,
          lineHeight: 1.1,
        }}>
          {word1}{word2 ? `\n${word2}.` : "."}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {children}
      </View>

      {/* Footer */}
      <View style={{
        position: "absolute",
        bottom: PAGE.marginY,
        left: PAGE.marginX,
        right: PAGE.marginX,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Text style={{ fontFamily: F.mono, fontSize: 7, color: C.mute, letterSpacing: 1 }}>
          Protocol · Confidential
        </Text>
        <Text
          style={{ fontFamily: F.mono, fontSize: 7, color: C.mute }}
          render={({ pageNumber }) => `${pageNumber}`}
        />
      </View>
    </Page>
  );
}

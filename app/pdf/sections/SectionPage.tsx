import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";
import { C, F, PAGE } from "../pdfTheme";

// ── Section Title Page ───────────────────────────────────────────────────────
// Full-page chapter divider — one per section, before the content pages.

type TitleProps = {
  sectionLabel:  string;
  categoryLabel: string;
  sectionIndex:  number; // 1-based
};

export function SectionTitlePage({ sectionLabel, categoryLabel, sectionIndex }: TitleProps) {
  const [word1, ...rest] = sectionLabel.split(" ");
  const word2 = rest.join(" ");
  const num   = String(sectionIndex).padStart(2, "0");

  return (
    <Page
      size="A4"
      style={{ backgroundColor: C.coverBg, flexDirection: "column", justifyContent: "space-between" }}
    >
      {/* Top — wordmark + category, same hierarchy as CoverPage */}
      <View style={{ paddingLeft: PAGE.marginX, paddingTop: PAGE.marginY }}>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 9,
          color: "#4a6875",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}>
          PROTOCOL
        </Text>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: "#354a53",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginTop: 4,
        }}>
          {categoryLabel}
        </Text>
      </View>

      {/* Center — number watermark + section title, mirrors CoverPage name treatment */}
      <View style={{ paddingLeft: PAGE.marginX, paddingRight: PAGE.marginX }}>
        <Text style={{
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 112,
          color: "#253239",
          lineHeight: 1,
          marginBottom: -16,
        }}>
          {num}
        </Text>
        <Text style={{
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: 44,
          color: C.white,
          lineHeight: 1.15,
        }}>
          {word1}
          {word2 ? `\n${word2}.` : "."}
        </Text>
      </View>

      {/* Bottom — date line style from CoverPage footer */}
      <View style={{ paddingLeft: PAGE.marginX, paddingBottom: PAGE.marginY }}>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: "#354a53",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}>
          CONFIDENTIAL
        </Text>
      </View>
    </Page>
  );
}

// ── Section Content Page ─────────────────────────────────────────────────────
// Content wrapper — follows the title page. Has stripe, breadcrumb, footer.
// No hero heading (that lives on the title page).

type ContentProps = {
  sectionLabel:  string;
  categoryLabel: string;
  firstName:     string;
  children:      React.ReactNode;
};

export function SectionPage({ sectionLabel, categoryLabel, firstName, children }: ContentProps) {
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
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: C.accent }} />

      {/* Breadcrumb */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24, marginTop: 4 }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: C.mute, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Protocol · {firstName} · {sectionLabel}
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

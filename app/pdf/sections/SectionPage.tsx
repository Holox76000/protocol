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
      {/* Accent left strip */}
      <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.accent }} />

      {/* Top area */}
      <View style={{ paddingLeft: PAGE.marginX + 8, paddingTop: PAGE.marginY }}>
        <Text style={{
          fontFamily: F.mono,
          fontSize: 8,
          color: "#4a6875",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Protocol · {categoryLabel}
        </Text>
      </View>

      {/* Center — section name */}
      <View style={{ paddingLeft: PAGE.marginX + 8, paddingRight: PAGE.marginX }}>
        {/* Faint large number watermark */}
        <Text style={{
          fontFamily: F.sans,
          fontWeight: 600,
          fontSize: 120,
          color: "#253239",
          lineHeight: 1,
          marginBottom: -20,
        }}>
          {num}
        </Text>
        {/* Title */}
        <Text style={{
          fontFamily: F.serif,
          fontStyle: "italic",
          fontSize: 48,
          color: C.white,
          lineHeight: 1.1,
        }}>
          {word1}
          {word2 ? `\n${word2}.` : "."}
        </Text>
      </View>

      {/* Bottom */}
      <View style={{
        paddingLeft: PAGE.marginX + 8,
        paddingBottom: PAGE.marginY,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingRight: PAGE.marginX,
      }}>
        <Text style={{ fontFamily: F.mono, fontSize: 8, color: "#4a6875", letterSpacing: 2, textTransform: "uppercase" }}>
          PROTOCOL
        </Text>
        <View style={{ width: 32, height: 2, backgroundColor: C.accent, opacity: 0.5 }} />
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

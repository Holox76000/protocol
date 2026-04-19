import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { C, F } from "../pdfTheme";

// Minimal markdown → react-pdf renderer.
// Handles: ## headings, ### subheadings, **bold**, - bullets, paragraphs.
// No external parser — avoids bundle bloat in a Node.js route.

// Replace Unicode characters that fall outside fontsource Latin subset coverage.
// Fontsource "latin" covers U+0000–U+024F; General Punctuation (U+2000–U+206F)
// is NOT included — em/en dashes, smart quotes, ellipsis etc. cause fontkit to
// crash with "Offset outside DataView bounds" when embedding the glyph subset.
function sanitize(text: string): string {
  return (
    text
      // Decompose accented/composite chars (é → e + ́) then strip combining marks.
      // fontkit's TrueType composite-glyph encoder crashes with "Offset outside
      // DataView bounds" on certain accented characters (e.g. é U+00E9) when the
      // glyph is stored as a TrueType composite in the Inter latin subset font.
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")   // strip combining diacritical marks
      // Punctuation outside Basic Latin / Latin-1 Supplement
      .replace(/\u2014/g, "--")           // em dash
      .replace(/\u2013/g, "-")            // en dash
      .replace(/\u2026/g, "...")          // ellipsis
      .replace(/[\u201C\u201D]/g, '"')    // smart double quotes
      .replace(/[\u2018\u2019]/g, "'")    // smart single quotes
      .replace(/\u00A0/g, " ")            // non-breaking space
      .replace(/\u00B0/g, " deg")         // degree sign °
      .replace(/\u00D7/g, "x")            // multiplication sign ×
      .replace(/\u00B1/g, "+/-")          // plus-minus ±
      .replace(/\u2022/g, "-")            // bullet •
      .replace(/\u2192/g, "->")           // →
      .replace(/\u2190/g, "<-")           // ←
      .replace(/[\u2000-\u206F]/g, " ")   // remaining General Punctuation
      .replace(/[\u2200-\u22FF]/g, "")    // Math operators
  );
}

type Block =
  | { type: "h2";    text: string }
  | { type: "h3";    text: string }
  | { type: "bullet"; text: string }
  | { type: "para";   runs: Run[] };

type Run = { text: string; bold: boolean };

function parseRuns(line: string): Run[] {
  const runs: Run[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) runs.push({ text: line.slice(last, m.index), bold: false });
    runs.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) runs.push({ text: line.slice(last), bold: false });
  return runs;
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let paraLines: string[] = [];

  const flushPara = () => {
    const text = paraLines.join(" ").trim();
    if (text) blocks.push({ type: "para", runs: parseRuns(text) });
    paraLines = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); continue; }

    if (line.startsWith("### ")) { flushPara(); blocks.push({ type: "h3", text: line.slice(4) }); continue; }
    if (line.startsWith("## "))  { flushPara(); blocks.push({ type: "h2", text: line.slice(3) }); continue; }
    if (line.startsWith("# "))   { flushPara(); blocks.push({ type: "h2", text: line.slice(2) }); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      blocks.push({ type: "bullet", text: line.slice(2) });
      continue;
    }
    paraLines.push(line);
  }
  flushPara();
  return blocks;
}

export function ProseSection({ content }: { content: string }) {
  const blocks = parseBlocks(sanitize(content));

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <Text key={i} style={{
              fontFamily: F.sans,
              fontSize: 14,
              fontWeight: 600,
              color: C.void,
              marginTop: i === 0 ? 0 : 20,
              marginBottom: 6,
              paddingBottom: 5,
              borderBottomWidth: 1,
              borderBottomColor: C.wire,
            }}>
              {block.text}
            </Text>
          );
        }

        if (block.type === "h3") {
          return (
            <Text key={i} style={{
              fontFamily: F.mono,
              fontSize: 8,
              color: C.mute,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 14,
              marginBottom: 4,
            }}>
              {block.text}
            </Text>
          );
        }

        if (block.type === "bullet") {
          return (
            <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 8 }}>
              <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.accent, marginRight: 6, marginTop: 1 }}>
                ·
              </Text>
              <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.void, lineHeight: 1.6, flex: 1 }}>
                {block.text}
              </Text>
            </View>
          );
        }

        // para
        return (
          <Text key={i} style={{
            fontFamily: F.sans,
            fontSize: 11,
            color: C.void,
            lineHeight: 1.7,
            marginBottom: 8,
          }}>
            {block.runs.map((run, j) => (
              <Text key={j} style={{ fontWeight: run.bold ? 600 : 400 }}>
                {run.text}
              </Text>
            ))}
          </Text>
        );
      })}
    </View>
  );
}

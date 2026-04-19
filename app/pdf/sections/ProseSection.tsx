import React from "react";
import { View, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { C, F } from "../pdfTheme";

// ── Unicode sanitizer ────────────────────────────────────────────────────────
// fontkit v2.0.4 crashes on TrueType composite glyphs (Offset > DataView bounds)
// for characters outside the fontsource Latin subset. Normalize + strip them.
function sanitize(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")   // strip combining diacritical marks (é→e)
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

// ── Block types ──────────────────────────────────────────────────────────────
type Block =
  | { type: "h2";     text: string }
  | { type: "h3";     text: string }
  | { type: "bullet"; runs: Run[] }
  | { type: "para";   runs: Run[] }
  | { type: "table";  headers: string[]; rows: string[][] };

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

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)  // remove empty first/last from leading/trailing |
    .map(cell => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s|:-]+\|$/.test(line);
}

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let paraLines: string[] = [];
  let tableLines: string[] = [];
  let inTable = false;

  const flushPara = () => {
    const text = paraLines.join(" ").trim();
    if (text) blocks.push({ type: "para", runs: parseRuns(text) });
    paraLines = [];
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      // Too few lines for a real table — treat as paragraphs
      for (const l of tableLines) paraLines.push(l);
      flushPara();
    } else {
      const headers = parseTableRow(tableLines[0]);
      const dataRows = tableLines.slice(1).filter(l => !isTableSeparator(l)).map(parseTableRow);
      if (dataRows.length > 0) {
        blocks.push({ type: "table", headers, rows: dataRows });
      }
    }
    tableLines = [];
    inTable = false;
  };

  for (const raw of lines) {
    const line = raw.trim();

    // Table detection: line starts and ends with |
    const isTableLine = line.startsWith("|") && line.endsWith("|");

    if (isTableLine) {
      if (!inTable) {
        flushPara(); // flush any pending paragraph before table
        inTable = true;
      }
      if (!isTableSeparator(line)) {
        tableLines.push(line);
      }
      continue;
    }

    if (inTable) {
      flushTable();
    }

    if (!line) { flushPara(); continue; }

    if (line.startsWith("### ")) { flushPara(); blocks.push({ type: "h3", text: line.slice(4) }); continue; }
    if (line.startsWith("## "))  { flushPara(); blocks.push({ type: "h2", text: line.slice(3) }); continue; }
    if (line.startsWith("# "))   { flushPara(); blocks.push({ type: "h2", text: line.slice(2) }); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushPara();
      blocks.push({ type: "bullet", runs: parseRuns(line.slice(2)) });
      continue;
    }
    paraLines.push(line);
  }

  if (inTable) flushTable();
  flushPara();

  return blocks;
}

// ── Table renderer ───────────────────────────────────────────────────────────
function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const colCount = headers.length;

  return (
    <View style={{ marginBottom: 12, marginTop: 8 }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", backgroundColor: C.void }}>
        {headers.map((h, i) => (
          <View key={i} style={{ flex: 1, padding: "5pt 8pt", borderRightWidth: i < colCount - 1 ? 1 : 0, borderRightColor: "#354a53" }}>
            <Text style={{ fontFamily: F.sans, fontSize: 8, fontWeight: 600, color: C.white, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {h}
            </Text>
          </View>
        ))}
      </View>

      {/* Data rows */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={{
            flexDirection: "row",
            backgroundColor: ri % 2 === 0 ? C.white : C.ash,
            borderBottomWidth: 1,
            borderBottomColor: C.wire,
          }}
        >
          {row.map((cell, ci) => (
            <View key={ci} style={{ flex: 1, padding: "5pt 8pt", borderRightWidth: ci < colCount - 1 ? 1 : 0, borderRightColor: C.wire }}>
              <Text style={{ fontFamily: F.sans, fontSize: 9, color: C.void, lineHeight: 1.4 }}>
                {cell}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Runs renderer ────────────────────────────────────────────────────────────
function Runs({ runs, style }: { runs: Run[]; style: Style }) {
  return (
    <Text style={style}>
      {runs.map((run, j) => (
        <Text key={j} style={{ fontWeight: run.bold ? 600 : 400 }}>{run.text}</Text>
      ))}
    </Text>
  );
}

// ── Height estimation for smart page-break decisions ─────────────────────────
// SectionPage content area ≈ 841.89 − paddingTop(52) − paddingBottom(72) − breadcrumb(40)
const CONTENT_H = 678;
const CHARS_PER_LINE = 78; // Inter 11pt on ~499pt column

function estimateBlockH(block: Block): number {
  switch (block.type) {
    case "h2":    return 46;  // 14pt + marginTop 20 + marginBottom 6 + border
    case "h3":    return 30;  // 8pt + marginTop 14 + marginBottom 4 + tracking
    case "table": return 28 + block.rows.length * 22 + 16;
    case "bullet": {
      const chars = block.runs.reduce((s, r) => s + r.text.length, 0);
      return Math.max(1, Math.ceil(chars / CHARS_PER_LINE)) * 20 + 4;
    }
    case "para": {
      const chars = block.runs.reduce((s, r) => s + r.text.length, 0);
      return Math.max(1, Math.ceil(chars / CHARS_PER_LINE)) * 21 + 8;
    }
  }
}

// Returns the set of block indices (h2 only) that need a forced page break before them.
function computeBreaks(blocks: Block[]): Set<number> {
  const breaks = new Set<number>();
  let y = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === "h2" && i > 0) {
      // Measure height of the entire section starting at this h2 (up to the next h2)
      let sectionH = 0;
      for (let j = i; j < blocks.length; j++) {
        if (j > i && blocks[j].type === "h2") break;
        sectionH += estimateBlockH(blocks[j]);
      }

      if (y + sectionH > CONTENT_H) {
        breaks.add(i);
        y = 0; // reset: this section starts at top of a new page
      }
    }

    const h = estimateBlockH(block);
    y += h;
    // If we've overflowed, carry the remainder to the next page
    if (y > CONTENT_H) y = y % CONTENT_H;
  }

  return breaks;
}

// ── ProseSection ─────────────────────────────────────────────────────────────
export function ProseSection({ content }: { content: string }) {
  const blocks = parseBlocks(sanitize(content));
  const breaksBefore = computeBreaks(blocks);

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          const forceBreak = breaksBefore.has(i);
          return (
            <View key={i} break={forceBreak}>
              <Text style={{
                fontFamily: F.sans,
                fontSize: 14,
                fontWeight: 600,
                color: C.void,
                marginTop: forceBreak || i === 0 ? 0 : 20,
                marginBottom: 6,
                paddingBottom: 5,
                borderBottomWidth: 1,
                borderBottomColor: C.wire,
              }}>
                {block.text}
              </Text>
            </View>
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

        if (block.type === "table") {
          return <TableBlock key={i} headers={block.headers} rows={block.rows} />;
        }

        if (block.type === "bullet") {
          return (
            <View key={i} style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 8 }}>
              <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.accent, marginRight: 6, marginTop: 1 }}>
                ·
              </Text>
              <Runs runs={block.runs} style={{ fontFamily: F.sans, fontSize: 11, color: C.void, lineHeight: 1.6, flex: 1 }} />
            </View>
          );
        }

        // para
        return (
          <Runs
            key={i}
            runs={block.runs}
            style={{ fontFamily: F.sans, fontSize: 11, color: C.void, lineHeight: 1.7, marginBottom: 8 }}
          />
        );
      })}
    </View>
  );
}

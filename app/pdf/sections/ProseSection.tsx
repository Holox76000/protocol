import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { C, F } from "../pdfTheme";

// Minimal markdown → react-pdf renderer.
// Handles: ## headings, ### subheadings, **bold**, - bullets, paragraphs.
// No external parser — avoids bundle bloat in a Node.js route.

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
  const blocks = parseBlocks(content);

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

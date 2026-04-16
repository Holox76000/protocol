"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import React from "react";

const METRIC_KEYWORDS = [
  "swr", "cwr", "bf%", "body fat", "pas", "posture", "ti", "taper",
  "shoulder", "waist", "chest", "proportion", "ratio", "silhouette",
  "muscle", "body fat", "fat", "physique", "morpho",
];

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children);
  return "";
}

function isMetricLinked(text: string): boolean {
  const lower = text.toLowerCase();
  return METRIC_KEYWORDS.some((kw) => lower.includes(kw));
}

function GenericBadge() {
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
      Generic
    </span>
  );
}

function makeComponents(showMetricLabels: boolean): Components {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-10 font-display text-[28px] font-normal leading-tight text-void first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 font-display text-[22px] font-normal leading-tight text-void first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-[15px] font-semibold uppercase tracking-[0.1em] text-void">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-[14.5px] leading-relaxed text-dim">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 space-y-1.5 pl-5 text-[14.5px] text-dim [&>li]:list-disc">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 space-y-1.5 pl-5 text-[14.5px] text-dim [&>li]:list-decimal">{children}</ol>
    ),
    li: ({ children }) => {
      const showBadge = showMetricLabels && !isMetricLinked(extractText(children));
      return (
        <li className="leading-relaxed">
          {children}
          {showBadge && <GenericBadge />}
        </li>
      );
    },
    strong: ({ children }) => <strong className="font-semibold text-void">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-8 border-wire" />,
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-2 border-wire pl-4 text-[14px] italic text-dim">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-wire bg-ash px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-wire px-3 py-2 text-[13px] text-dim">{children}</td>
    ),
  };
}

export default function ProtocolView({
  content,
  showMetricLabels = false,
}: {
  content: string;
  showMetricLabels?: boolean;
}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(showMetricLabels)}>
      {content}
    </ReactMarkdown>
  );
}

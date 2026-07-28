"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import Link from "next/link";

function slugify(children: React.ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((c) => (typeof c === "string" ? c : "")).join("")
    : String(children ?? "");
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const components: Components = {
  h1: ({ children }) => (
    <h1
      id={slugify(children)}
      className="scroll-mt-24 font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight mt-2 mb-5"
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      id={slugify(children)}
      className="scroll-mt-24 font-display text-2xl font-semibold text-ink tracking-tight mt-12 mb-4 pb-2 border-b border-wire"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={slugify(children)}
      className="scroll-mt-24 font-display text-lg font-semibold text-ink mt-8 mb-3"
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold uppercase tracking-wide text-dim mt-6 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-ink/90 my-4">{children}</p>
  ),
  a: ({ href, children }) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#");
    if (isInternal) {
      return (
        <Link
          href={href ?? "#"}
          className="text-void underline decoration-wire underline-offset-2 hover:decoration-void"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-void underline decoration-wire underline-offset-2 hover:decoration-void"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="my-4 space-y-2 pl-5 list-disc marker:text-mute text-[15px] leading-7 text-ink/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 space-y-2 pl-5 list-decimal marker:text-mute text-[15px] leading-7 text-ink/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-2 border-void/30 bg-pebble pl-4 py-1 pr-3 text-ink/80 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className || "");
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-pebble border border-wire px-1.5 py-0.5 text-[13px] font-mono text-void">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-5 overflow-x-auto rounded-lg bg-void text-pebble p-4 text-[13px] leading-6 font-mono">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-wire">
      <table className="w-full border-collapse text-[13.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-pebble">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-wire px-3 py-2 text-left font-semibold text-ink whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-wire/60 px-3 py-2 align-top text-ink/85">
      {children}
    </td>
  ),
  hr: () => <hr className="my-10 border-t border-wire" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt || ""} className="my-6 rounded-lg border border-wire max-w-full" />
  ),
};

export default function DocMarkdown({ content }: { content: string }) {
  return (
    <div className="docs-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

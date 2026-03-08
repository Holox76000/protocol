"use client";

import { useEffect, useRef } from "react";

type LegacyHtmlProps = {
  className?: string;
  html: string;
};

export default function LegacyHtml({ className, html }: LegacyHtmlProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  return <div ref={ref} className={className} suppressHydrationWarning />;
}

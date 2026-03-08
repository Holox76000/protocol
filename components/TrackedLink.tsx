"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: Parameters<typeof trackEvent>[0];
  payload?: Record<string, unknown>;
  children: ReactNode;
};

export function TrackedLink({ event, payload, onClick, children, ...props }: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(evt) => {
        trackEvent(event, payload ?? {});
        onClick?.(evt);
      }}
    >
      {children}
    </a>
  );
}

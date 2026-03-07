"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  trackingPayload?: Record<string, unknown>;
};

export function TrackedLink({
  children,
  href,
  onClick,
  trackingPayload,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        trackEvent("cta_clicked", {
          href,
          ...trackingPayload
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}

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
  const destination = typeof href === "string" ? href : undefined;

  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        trackEvent("cta_clicked", {
          href: destination,
          ...trackingPayload
        });

        // External checkout redirects can interrupt the pixel request before Meta Helper sees it.
        if (
          destination &&
          /^https?:\/\//.test(destination) &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          props.target !== "_blank"
        ) {
          event.preventDefault();
          window.setTimeout(() => {
            window.location.assign(destination);
          }, 150);
        }
      }}
    >
      {children}
    </a>
  );
}

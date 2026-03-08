"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  event?: Parameters<typeof trackEvent>[0];
  payload?: Record<string, unknown>;
  trackingPayload?: Record<string, unknown>;
};

export function TrackedLink({
  children,
  event,
  href,
  onClick,
  payload,
  trackingPayload,
  target,
  ...props
}: TrackedLinkProps) {
  const destination = typeof href === "string" ? href : undefined;
  const eventName = event ?? "cta_clicked";
  const eventPayload = payload ?? {
    href: destination,
    ...trackingPayload,
  };

  return (
    <a
      {...props}
      href={href}
      target={target}
      onClick={(clickEvent) => {
        onClick?.(clickEvent);
        if (clickEvent.defaultPrevented) return;

        trackEvent(eventName, eventPayload);

        if (
          destination &&
          /^https?:\/\//.test(destination) &&
          clickEvent.button === 0 &&
          !clickEvent.metaKey &&
          !clickEvent.ctrlKey &&
          !clickEvent.shiftKey &&
          !clickEvent.altKey &&
          target !== "_blank"
        ) {
          clickEvent.preventDefault();
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

"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackGa4Event, type Ga4EventParams } from "../lib/ga4Event";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: string;
  eventParams?: Ga4EventParams;
  children: ReactNode;
};

export default function TrackedLink({
  eventName,
  eventParams,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackGa4Event(eventName, eventParams);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}

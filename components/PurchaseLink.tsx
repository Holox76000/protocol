"use client";

import type { ReactNode } from "react";
import { trackEvent } from "../lib/analytics";

type PurchaseLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function PurchaseLink({ href, className, children }: PurchaseLinkProps) {
  const handleClick = () => {
    trackEvent("purchase");
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

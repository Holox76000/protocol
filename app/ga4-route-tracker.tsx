"use client";

import { useEffect, useRef } from "react";
import { getGa4PageTitle } from "../lib/ga4PageTitle";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = "G-8PLVP5JKV0";

function getCurrentPagePath() {
  return `${window.location.pathname}${window.location.search}`;
}

export default function Ga4RouteTracker() {
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const trackPageView = () => {
      const pagePath = getCurrentPagePath();

      if (previousUrlRef.current === pagePath) {
        return;
      }

      previousUrlRef.current = pagePath;

      window.gtag?.("config", GA_MEASUREMENT_ID, {
        page_title: getGa4PageTitle(pagePath),
        page_path: pagePath,
        page_location: `${window.location.origin}${pagePath}`,
      });

      window.fbq?.("track", "PageView");
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = ((...args) => {
      const result = originalPushState(...args);
      window.dispatchEvent(new Event("protocol:locationchange"));
      return result;
    }) as History["pushState"];

    window.history.replaceState = ((...args) => {
      const result = originalReplaceState(...args);
      window.dispatchEvent(new Event("protocol:locationchange"));
      return result;
    }) as History["replaceState"];

    const handleLocationChange = () => {
      window.setTimeout(trackPageView, 0);
    };

    trackPageView();
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("protocol:locationchange", handleLocationChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("protocol:locationchange", handleLocationChange);
    };
  }, []);

  return null;
}

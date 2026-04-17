"use client";

import { useEffect, useRef } from "react";
import { getGa4PageTitle } from "../lib/ga4PageTitle";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../lib/utm";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function getCurrentPagePath() {
  return `${window.location.pathname}${window.location.search}`;
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem("prtcl_ga4_sid");
    if (existing) return existing;
    const newId = String(Date.now());
    window.sessionStorage.setItem("prtcl_ga4_sid", newId);
    return newId;
  } catch {
    return String(Date.now());
  }
}

function getPrtclUserId(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)prtcl_uid=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export default function Ga4RouteTracker() {
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const trackPageView = () => {
      const pagePath = getCurrentPagePath();

      if (previousUrlRef.current === pagePath) return;
      previousUrlRef.current = pagePath;

      // Capture UTMs from current URL and merge into sessionStorage
      persistUtmParams(getUtmParams());

      const pageTitle = getGa4PageTitle(pagePath);
      const sessionId = getOrCreateSessionId();
      const userId = getPrtclUserId();
      const utm = getPersistedUtmParams();

      // Send pageview via Measurement Protocol (server-side)
      navigator.sendBeacon(
        "/api/ga4-event",
        JSON.stringify({
          eventName: "page_view",
          pagePath,
          pageTitle,
          params: {
            session_id: sessionId,
            ...(Object.keys(utm).length > 0 && utm),
          },
          ...(userId && { userId }),
        }),
      );

      // Meta Pixel pageview (stays client-side)
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

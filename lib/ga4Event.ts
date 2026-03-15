export type Ga4EventParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGa4Event(eventName: string, params: Ga4EventParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", eventName, params);
}

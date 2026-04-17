export type Ga4EventParams = Record<string, unknown>;

export function trackGa4Event(eventName: string, params: Ga4EventParams = {}) {
  if (typeof window === "undefined") return;

  navigator.sendBeacon(
    "/api/ga4-event",
    JSON.stringify({ eventName, params }),
  );
}

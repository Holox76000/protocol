import { getPersistedUtmParams } from "./utm";

export type Ga4EventParams = Record<string, unknown>;

function getGa4SessionId(): string | null {
  try {
    return window.sessionStorage.getItem("prtcl_ga4_sid");
  } catch {
    return null;
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

export function trackGa4Event(eventName: string, params: Ga4EventParams = {}) {
  if (typeof window === "undefined") return;

  const sessionId = getGa4SessionId();
  const userId = getPrtclUserId();
  const utm = getPersistedUtmParams();

  const enrichedParams: Ga4EventParams = {
    ...params,
    ...(sessionId && { session_id: sessionId }),
    ...(Object.keys(utm).length > 0 && utm),
  };

  navigator.sendBeacon(
    "/api/ga4-event",
    JSON.stringify({
      eventName,
      params: enrichedParams,
      ...(userId && { userId }),
    }),
  );
}

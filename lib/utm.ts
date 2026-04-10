export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_adset?: string;
  utm_ad?: string;
  utm_id?: string;
  fbclid?: string;
};

const UTM_STORAGE_KEY = "prtcl_utm";
const UTM_KEYS: (keyof UtmParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_adset",
  "utm_ad",
  "utm_id",
  "fbclid",
];

/** Read UTM params from the current URL (client-side only). */
export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) result[key] = val;
  }
  return result;
}

/**
 * Persist UTM params to sessionStorage so they survive navigation across
 * pages in the same tab (e.g. /f1 → /f1/offer → /checkout).
 * Only overwrites keys that are present in the new params (merge strategy).
 */
export function persistUtmParams(params: UtmParams): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getPersistedUtmParams();
    const merged = { ...existing, ...filterEmpty(params) };
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage may be blocked in some browsers
  }
}

/** Read persisted UTM params from sessionStorage. */
export function getPersistedUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

/**
 * Append UTM params (and fbclid) to a path, preserving any existing query
 * params already on the path.
 *
 * Example:
 *   appendUtmToPath("/f1/offer", { utm_source: "fb", utm_campaign: "xyz" })
 *   → "/f1/offer?utm_source=fb&utm_campaign=xyz"
 */
export function appendUtmToPath(path: string, params: UtmParams): string {
  const clean = filterEmpty(params);
  if (Object.keys(clean).length === 0) return path;

  const [base, existing] = path.split("?");
  const qs = new URLSearchParams(existing ?? "");
  for (const key of UTM_KEYS) {
    const val = clean[key];
    if (val) qs.set(key, val);
  }
  const queryString = qs.toString();
  return queryString ? `${base}?${queryString}` : base;
}

function filterEmpty(params: UtmParams): Partial<Record<keyof UtmParams, string>> {
  const result: Partial<Record<keyof UtmParams, string>> = {};
  for (const key of UTM_KEYS) {
    const val = params[key];
    if (val) result[key] = val;
  }
  return result;
}

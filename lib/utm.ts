export type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_adset?: string;
  utm_ad?: string;
  utm_id?: string;
};

export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    utm_adset: params.get("utm_adset") ?? undefined,
    utm_ad: params.get("utm_ad") ?? undefined,
    utm_id: params.get("utm_id") ?? undefined
  };
}

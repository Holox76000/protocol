function post(body: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") return;
  fetch("/api/ga4-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export function trackFunnelPageView(slideId: string, basePath = "/funnel") {
  post({
    eventName: "page_view",
    pagePath: `${basePath}/step/${slideId}`,
    pageTitle: `Funnel — ${slideId}`,
  });
}

export function trackFunnelAnswer(slideId: string, value: string | string[], basePath = "/funnel") {
  post({
    eventName: "funnel_answer",
    pagePath: `${basePath}/step/${slideId}`,
    params: {
      slide_id: slideId,
      answer_value: Array.isArray(value) ? value.join("|") : value,
    },
  });
}

export function trackFunnelPhotoUploaded(basePath = "/funnel") {
  post({
    eventName: "funnel_photo_uploaded",
    pagePath: `${basePath}/step/photo-upload`,
  });
}

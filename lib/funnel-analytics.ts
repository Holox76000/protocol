function post(body: Record<string, unknown>) {
  fetch("/api/ga4-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export function trackFunnelPageView(slideId: string) {
  post({
    eventName: "page_view",
    pagePath: `/funnel/step/${slideId}`,
    pageTitle: `Funnel — ${slideId}`,
  });
}

export function trackFunnelAnswer(slideId: string, value: string | string[]) {
  post({
    eventName: "funnel_answer",
    pagePath: `/funnel/step/${slideId}`,
    params: {
      slide_id: slideId,
      answer_value: Array.isArray(value) ? value.join("|") : value,
    },
  });
}

export function trackFunnelPhotoUploaded() {
  post({
    eventName: "funnel_photo_uploaded",
    pagePath: "/funnel/step/photo-upload",
  });
}

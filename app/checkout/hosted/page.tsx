import CheckoutClient from "../CheckoutClient";

export const runtime = "nodejs";

const KNOWN_FUNNELS = new Set(["main", "f2", "v3", "woman", "f1"]);

export default function CheckoutHostedPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const rawFunnel = searchParams?.funnel?.trim() || "main";
  const funnel = KNOWN_FUNNELS.has(rawFunnel) ? rawFunnel : "main";

  const params: Record<string, string> = { funnel };
  const forward = [
    "funnel_type", "customer_email", "landing_page",
    "utm_source", "utm_medium", "utm_campaign",
    "utm_content", "utm_term", "utm_id", "fbclid",
  ];
  for (const key of forward) {
    const val = searchParams?.[key];
    if (val) params[key] = val;
  }

  return <CheckoutClient funnel={funnel} params={params} />;
}

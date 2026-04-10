function normalizeSegment(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFunnelLabel(funnel?: string | null) {
  if (!funnel || funnel === "main") return "Main";
  if (funnel === "v2" || funnel === "f2") return "V2";
  if (funnel === "v3") return "V3";
  if (funnel === "woman") return "Women";
  return funnel.toUpperCase();
}

export function getGa4PageTitle(pagePath: string) {
  const [pathname, search = ""] = pagePath.split("?");
  const params = new URLSearchParams(search);
  const funnel = getFunnelLabel(params.get("funnel"));

  if (pathname === "/") return "Protocol | Landing | Main";
  if (pathname === "/woman") return "Protocol | Landing | Women";
  if (pathname === "/woman/offer") return "Protocol | Offer | Women";
  if (pathname === "/woman/signup") return "Protocol | Signup | Women";
  if (pathname === "/woman/quiz") return "Protocol | Quiz Entry | Women";
  const womanQuizMatch = pathname.match(/^\/woman\/quiz\/(\d+)$/);
  if (womanQuizMatch) return `Protocol | Quiz | Step ${womanQuizMatch[1]} | Women`;
  if (pathname === "/program") return "Protocol | Landing | Main";
  if (pathname === "/f2") return "Protocol | Funnel Entry | V2";
  if (pathname === "/v3") return "Protocol | Funnel Entry | V3";
  if (pathname === "/interface") return "Protocol | Interface";
  if (pathname === "/login") return "Protocol | Login";
  if (pathname === "/admin") return "Protocol | Admin";
  if (pathname === "/checkout") return "Protocol | Checkout";
  if (pathname === "/checkout/hosted") return `Protocol | Checkout | ${funnel}`;
  if (pathname === "/checkout/success") return `Protocol | Checkout Success | ${funnel}`;
  if (pathname === "/checkout/cancel") return `Protocol | Checkout Cancel | ${funnel}`;
  if (pathname === "/f2/landing") return "Protocol | Landing | V2";
  if (pathname === "/program/legal") return "Protocol | Legal";
  if (pathname === "/program/legal/privacy-policy") return "Protocol | Privacy Policy";
  if (pathname === "/program/resources") return "Protocol | Resources";
  if (pathname === "/visualization/upload-intro") return "Protocol | Visualization | Upload Intro | Main";
  if (pathname === "/visualization/unlock-info") return "Protocol | Visualization | Unlock Info | Main";

  const visualizationMatch = pathname.match(/^\/(?:(f2|v3)\/)?visualization\/(upload|preview|unlock)$/);
  if (visualizationMatch) {
    const [, pathFunnel, step] = visualizationMatch;
    return `Protocol | Visualization | ${normalizeSegment(step)} | ${getFunnelLabel(pathFunnel)}`;
  }

  const questionMatch = pathname.match(/^\/v3\/questions\/(\d+)$/);
  if (questionMatch) {
    return `Protocol | Questionnaire | Question ${questionMatch[1]} | V3`;
  }

  if (pathname === "/v3/questions") {
    return "Protocol | Questionnaire Entry | V3";
  }

  const fallback = pathname
    .split("/")
    .filter(Boolean)
    .map(normalizeSegment)
    .join(" | ");

  return fallback ? `Protocol | ${fallback}` : "Protocol";
}

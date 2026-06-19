import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import {
  getPatterns,
  getAgeInsight,
  getEthnicityInsight,
  getEnvParagraph,
  getHistoryParagraph,
} from "../../../lib/report-content";

// ── Helpers ──────────────────────────────────────────────

function formatHeight(params: URLSearchParams): string {
  const unit = params.get("height_unit");
  if (unit === "cm") {
    const cm = params.get("height_cm");
    return cm ? `${cm}cm` : "—";
  }
  const ft = params.get("height_ft");
  const inch = params.get("height_in");
  if (ft) return inch ? `${ft}'${inch}"` : `${ft}'`;
  return "—";
}

function formatWeight(params: URLSearchParams): string {
  const val = params.get("weight_value");
  const unit = params.get("weight_unit");
  if (!val) return "—";
  return unit ? `${val}${unit}` : `${val}kg`;
}

function formatAge(ageBracket: string): string {
  const map: Record<string, string> = {
    "20–29": "20s", "30–39": "30s", "40–49": "40s", "50+": "50s+",
  };
  return map[ageBracket] ?? ageBracket;
}

function formatEnv(env: string): string {
  const map: Record<string, string> = {
    "Corporate": "Corporate",
    "Entrepreneur / Startup": "Startup",
    "Manual / Trade work": "Trade",
    "Student": "Student",
    "Creative / Freelance": "Creative",
    "Medical / Healthcare": "Medical",
    "Other": "Other",
  };
  return map[env] ?? env;
}

function formatFrequency(weekly: string): string {
  const map: Record<string, string> = {
    "Zero effort right now": "0h/wk",
    "Less than 1 hour": "<1h/wk",
    "1 to 3 hours": "1–3h/wk",
    "3 to 5 hours": "3–5h/wk",
    "More than 5 hours": "5h+/wk",
  };
  return map[weekly] ?? weekly;
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ── Route handler ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Load template
  const templatePath = path.join(process.cwd(), "data", "report-template.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  // Build offer URL (pass through all current params)
  const vslUrl = `/f1/offer?${params.toString()}`;

  // Compute values
  const firstName = params.get("first_name") ?? "You";
  const morphology = params.get("morphology") ?? "Average";
  const env = params.get("social_environment") ?? "";
  const weekly = params.get("weekly_time") ?? "";
  const ageBracket = params.get("age_bracket") ?? "";
  const patterns = getPatterns(morphology);

  // Before/after images (passed from loading page once generation is done)
  const beforeUrl = params.get("before_url");
  const afterUrl = params.get("after_url");
  const beforePhoto = beforeUrl
    ? `<img src="${beforeUrl}" alt="You now" />`
    : `[ Your current photo ]`;
  const afterPhoto = afterUrl
    ? `<img src="${afterUrl}" alt="Your potential" />`
    : `[ Your projected potential ]`;

  // Apply replacements
  const replacements: Record<string, string> = {
    "{{FIRST_NAME}}": firstName,
    "{{DATE}}": formatDate(),
    "{{AGE}}": formatAge(ageBracket),
    "{{HEIGHT}}": formatHeight(params),
    "{{WEIGHT}}": formatWeight(params),
    "{{BODY_TYPE}}": morphology,
    "{{ENV}}": formatEnv(env),
    "{{FREQUENCY}}": formatFrequency(weekly),
    "{{PATTERN_1_TITLE}}": patterns.p1t,
    "{{PATTERN_1_BODY}}": patterns.p1b,
    "{{PATTERN_2_TITLE}}": patterns.p2t,
    "{{PATTERN_2_BODY}}": patterns.p2b,
    "{{PATTERN_3_TITLE}}": patterns.p3t,
    "{{PATTERN_3_BODY}}": patterns.p3b,
    "{{PATTERN_4_TITLE}}": patterns.p4t,
    "{{PATTERN_4_BODY}}": patterns.p4b,
    "{{ENVIRONMENT_PARAGRAPH}}": getEnvParagraph(env),
    "{{HISTORY_PARAGRAPH}}": getHistoryParagraph(params.get("past_solutions") ?? ""),
    "{{CHECKOUT_URL}}": vslUrl,
    "{{BEFORE_PHOTO}}": beforePhoto,
    "{{AFTER_PHOTO}}": afterPhoto,
    "{{AGE_INSIGHT}}": getAgeInsight(params.get("age_bracket") ?? ""),
    "{{ETHNICITY_INSIGHT}}": getEthnicityInsight(params.get("ethnicity") ?? ""),
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replaceAll(key, value);
  }

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

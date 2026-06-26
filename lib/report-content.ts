// Personalized content blocks generated from quiz answers.
// Shared between the report HTML route and the email nurture sequence.

export interface PatternSet {
  p1t: string; p1b: string;
  p2t: string; p2b: string;
  p3t: string; p3b: string;
  p4t: string; p4b: string;
}

export interface InsightContent {
  title: string;
  body: string;
}

// ── Patterns by morphology ───────────────────────────────

export function getPatterns(_morphology: string): PatternSet {
  // Universal pattern copy — outcome-first, not technical.
  // We used to vary text by morphology, but the emotional drivers (being
  // noticed, taking your shirt off, wearing what you want, feeling desired)
  // are the same across all builds. The morphology shows up later in the
  // actual deliverable, not in this preliminary frame.
  return {
    p1t: "Average doesn't get noticed",
    p1b: "The body that gets you noticed isn't a slightly better version of the one you have. It's a different category. Most men spend years chasing 'a little better' and stay invisible. Walking into a room and feeling different is one specific change, not ten.",
    p2t: "Losing weight won't make you feel sexy. The right shape will.",
    p2b: "5kg off the scale changes very little about how you look in a fitted shirt. The width of your shoulders, the line of your waist, the way clothes drape across your chest — that's what people see. And what you see in the mirror when you take your shirt off.",
    p3t: "Confidence in your body shows up everywhere else",
    p3b: "Men who change how they look in their own skin change the rest of their life within months. Dating apps. The way they hold themselves at work. Holiday photos. Beach moments. The body has been the bottleneck. Once you move it, everything downstream moves with it.",
    p4t: "Being someone other men want to be is closer than it feels",
    p4b: "Three specific wins close the gap. Wearing the fitted shirt you've been avoiding. Taking it off at the pool without thinking. Feeling desired in the room. Concrete. Measurable. That's what the Protocol is built around.",
  };
}

// ── Age + ethnicity insights (raw + HTML wrappers) ───────

export function getAgeContent(ageBracket: string): InsightContent | null {
  const map: Record<string, InsightContent> = {
    "20–29": {
      title: "Your 20s: the best window you'll have",
      body: "The gap between you and your peak is largest right now. Testosterone peaks around 25 and your body adapts to structured training faster than it ever will. Men who act in this window lock in changes that hold for 20+ years.",
    },
    "30–39": {
      title: "Your 30s: the window is still open",
      body: "Testosterone drops 1 to 2% per year but stays near peak. Slower metabolism makes body composition more predictable when the plan is precise. Most men get one shot at this alignment of motivation, resources, and biology.",
    },
    "40–49": {
      title: "Your 40s: unfocused training stops working",
      body: "High-volume training raises cortisol without producing adaptation. Men on targeted protocols here often outpace men half their age on generic programs. Precision beats effort.",
    },
    "50+": {
      title: "After 50: the approach changes, the potential doesn't",
      body: "Men who look worse at 55 than 45 followed the wrong program, not an inevitable biology. After 50 the work shifts: less mass, more proportions and posture. On the right plan you can look better than at 40.",
    },
  };
  return map[ageBracket] ?? null;
}

export function getEthnicityContent(ethnicity: string): InsightContent | null {
  const map: Record<string, InsightContent> = {
    "Caucasian": {
      title: "Your build: wide frame, midsection tendency",
      body: "European frames carry natural shoulder width but store fat in the abdomen first. That fat compresses your shoulder-to-waist ratio, the main score variable. Waist reduction alongside upper body work widens the gap.",
    },
    "Black": {
      title: "Your build: high natural muscle density",
      body: "West African-derived profiles tend toward high natural muscle density. Focus on refining what's there: definition and proportion over raw size. Over-developing non-key muscles can flatten visual symmetry.",
    },
    "Asian (East / SE)": {
      title: "Your build: narrow frame, fast-moving proportions",
      body: "Slimmer bone structure, lower body fat. The main lever is shoulder width relative to your naturally narrow waist. Small shoulder gains produce large visible change here, faster than most profiles.",
    },
    "South Asian": {
      title: "Your build: visceral fat tendency, strong recomp response",
      body: "Higher visceral fat despite moderate total weight is common on this build, tied to hormonal and metabolic factors. Waist-to-shoulder drives the score. Targeted abdominal work plus upper body building moves the needle faster than generic programs.",
    },
    "Hispanic-Latino": {
      title: "Your build: strong muscle response, lower-ab tendency",
      body: "Hispanic-Latino frames carry muscle well and adapt fast to hypertrophy. Main challenge: fat distribution in the lower abdomen. Sequenced fat loss followed by structural building moves quickly here.",
    },
    "MENA": {
      title: "Your build: high development potential, recomp-focused",
      body: "Strong muscle development potential combined with elevated abdominal fat storage. The approach: recomp. Build density while reducing fat in the areas that drive your waist-to-shoulder ratio.",
    },
  };
  return map[ethnicity] ?? null;
}

function insightHtml(title: string, body: string): string {
  return `<div class="insight"><div class="insight-title">${title}</div><div class="insight-body">${body}</div></div>`;
}

export function getAgeInsight(ageBracket: string): string {
  const c = getAgeContent(ageBracket);
  return c ? insightHtml(c.title, c.body) : "";
}

export function getEthnicityInsight(ethnicity: string): string {
  const c = getEthnicityContent(ethnicity);
  return c ? insightHtml(c.title, c.body) : "";
}

// ── Environment paragraph ────────────────────────────────

export function getEnvParagraph(env: string): string {
  const map: Record<string, string> = {
    "Corporate": "In corporate settings, body composition shifts how authority reads, separate from actual performance. Posture, shoulder width, lean definition: that's what registers in the room.",
    "Entrepreneur / Startup": "In startup environments, physical presence reads as a social signal in every pitch and meeting. The look tied to high-performers here, lean and composed, is closer than most men expect.",
    "Manual / Trade work": "Your work already signals strength. The targets here are the visual markers that read outside that context: proportions, defined waist, upper body shape.",
    "Student": "Peer comparison at this stage is constant and affects social dynamics directly. The plan produces visible results in 12 weeks, one academic term, with a schedule that fits full-time study.",
    "Creative / Freelance": "No dress code means presence stands out more, not less. High-performers in creative environments read as composed and healthy, not muscular. Different target than most programs are built for.",
    "Medical / Healthcare": "You already understand the physiology. Same literature you're trained on, applied to attractiveness specifically. Different goal, different approach.",
  };
  return map[env] ?? "Your environment shapes which changes return the most. The plan focuses on shoulder-to-waist ratio, body fat, and structural definition: what reads well in most social contexts.";
}

// ── History paragraph ────────────────────────────────────

export function getHistoryParagraph(pastSolutions: string | string[] | unknown): string {
  const raw = Array.isArray(pastSolutions) ? pastSolutions.join("|") : String(pastSolutions ?? "");
  const solutions = raw.toLowerCase();

  if (solutions.includes("nothing")) {
    return "Starting from zero is an advantage. No patterns to undo. The fitness industry is built for size and weight loss, not attractiveness. Building the right approach is faster than unbuilding the wrong one.";
  }
  if (solutions.includes("personal trainer")) {
    return "Trainers build for fitness, performance, or weight loss, not attractiveness. The goal is different, the work is different. What you've done wasn't wasted, it just wasn't aimed here.";
  }
  if (solutions.includes("youtube")) {
    return "YouTube is optimized for views, not your build. The high-view creators are genetic outliers selling personal experience as universal advice. Your variables are specific enough that no general video covers them.";
  }
  if (solutions.includes("diet")) {
    return "Diets produce weight changes, not attractiveness changes. Losing muscle alongside fat makes you smaller without making you look better. What you lose matters as much as how much.";
  }
  if (solutions.includes("surgery")) {
    return "Medical interventions target single variables. They work for specific changes, but attractiveness is the interaction between composition, proportions, and lifestyle, not any one factor.";
  }
  return "What you've tried wasn't built for this goal. Fitness programs and nutrition plans are designed for health or weight. None of them target what drives attractiveness.";
}

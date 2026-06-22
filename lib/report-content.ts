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

export function getPatterns(morphology: string): PatternSet {
  const m = morphology?.toLowerCase();

  if (m === "skinny") return {
    p1t: "Training harder won't change what you see in the mirror",
    p1b: "More effort gives the same reflection without the right structural targets. Shoulder width relative to waist is the variable. Not effort. Order.",
    p2t: "Your clothes are working against you",
    p2b: "Skinny frames hang flat in most clothes. At the same weight, structure across shoulders and chest decides whether you read as confident or invisible.",
    p3t: "High-volume training was built for someone else",
    p3b: "High-volume programs were built for average bodies. On your frame they produce fatigue without visible change. Which muscles, in what order: that's what matters.",
    p4t: "The target numbers are closer than most people think",
    p4b: "Shoulder-to-waist ratio and upper body density are your two levers. Both respond fast. Most skinny builds see visible change in 4 to 6 weeks.",
  };

  if (m === "skinny-fat") return {
    p1t: "Your body is gaining fat and losing muscle at the same time",
    p1b: "Skinny-fat is a cortisol-insulin imbalance: fat in the midsection, muscle loss in the limbs. Standard gym programs were built for other bodies and often make it worse.",
    p2t: "Your waist is what's controlling your silhouette",
    p2b: "Waist drives your score more than any other variable on your build. A 2 to 3cm reduction shifts your shoulder-to-waist ratio enough to move you out of the middle.",
    p3t: "Cutting and bulking both make your body type worse",
    p3b: "Aggressive cuts accelerate muscle loss. Surpluses store fat first. Recomposition is the only path: build and burn at once, in the right order.",
    p4t: "Sleep and stress matter as much as training",
    p4b: "Skinny-fat is cortisol-driven. Sleep, stress, and training are the same variable. Fix one without the others and you get partial results.",
  };

  if (m === "overweight") return {
    p1t: "Where fat sits matters more than how much you carry",
    p1b: "Your score isn't about total weight. It's about where fat sits. Two men at the same weight can score very differently.",
    p2t: "Visceral fat is flattening your V-taper",
    p2b: "Visceral fat pushes your waist out and compresses your V-taper. It's also the first fat to respond. Faster than subcutaneous.",
    p3t: "Standard diets shrink you without improving your shape",
    p3b: "Cut calories, run more: works for the scale, not for shape. Losing muscle alongside fat makes you smaller without making you defined.",
    p4t: "The structure is already there, it just needs uncovering",
    p4b: "Your structural base is already there. It's covered. Waist first, then upper body density: that order matters more than total effort.",
  };

  return {
    p1t: "Average is invisible, and most men stay there",
    p1b: "Average bodies hit a plateau because there's no obvious reason to push. The gap between 'acceptable' and 'memorable' is small. Most men never close it because no one shows them what to aim at.",
    p2t: "Proportions move the score. Weight barely does.",
    p2b: "At average composition, losing 5kg changes little. Shifting your shoulder-to-waist ratio by 0.15 changes a lot. Proportions are the variable. Weight is noise.",
    p3t: "Your environment pays back more than you put in",
    p3b: "Looking noticeably above average returns more than the work it takes. Men who move past their peer baseline see social and professional returns well beyond the physical change.",
    p4t: "The top 20% is a smaller jump than it appears",
    p4b: "Top 20% is three concrete targets: SWR > 1.52, body fat under 12%, shoulder-to-chest > 1.15. Measurable. Achievable. That's what the protocol is built around.",
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

export type AdVariant = {
  badge?: string;
  headline: string;
  subtext: string;
  cta?: string;
};

export const DEFAULT_VARIANT: AdVariant = {
  badge: "Attractiveness Diagnostic",
  headline: "Find out exactly where you stand.",
  subtext:
    "A 2-minute assessment that measures 18 variables in your appearance and tells you exactly what to fix first.",
  cta: "Start the assessment →",
};

// ─────────────────────────────────────────────────────────────────────────────
// Variants derived from visual analysis of each ad creative.
// IDs sourced from bouchou_ads_creatives CSV (May 2026 campaign).
// ─────────────────────────────────────────────────────────────────────────────

// "Is the way people treat you fixable?" — body signal score 4.2/10, "FIXABLE" badge
const FIXABLE: AdVariant = {
  badge: "Fixability Assessment",
  headline: "Find out if the way people treat you is actually fixable.",
  subtext:
    "Your body sends signals before you speak. A 2-minute assessment tells you your Body Signal Score and how high your real ceiling is.",
  cta: "Take the assessment →",
};

// "3 reasons you're overlooked in social situations" — iPhone Notes style, 3 bullets
const OVERLOOKED: AdVariant = {
  badge: "Social Presence Audit",
  headline: "Find the 3 reasons you're overlooked. None of them are your personality.",
  subtext:
    "Your body signals 'average' before you open your mouth. This assessment identifies exactly what to change to stop being invisible in any room.",
  cta: "See my 3 reasons →",
};

// "People decide how they'll treat you before you open your mouth" — bar scene before/after
const FIRST_IMPRESSION_BAR: AdVariant = {
  badge: "First Impression Analysis",
  headline: "People decide how they'll treat you before you open your mouth.",
  subtext:
    "Research found the formula that controls this first impression. Take 2 minutes to find out where you stand and what it actually takes to change it.",
  cta: "Find out where I stand →",
};

// "People decide..." — dressed man / corporate shirts before/after
const FIRST_IMPRESSION_DRESSED: AdVariant = {
  badge: "First Impression Analysis",
  headline: "People decide how they'll treat you before you open your mouth.",
  subtext:
    "Your body speaks before you do, even fully dressed. 2 minutes to find out what your appearance signals and the exact formula to change it.",
  cta: "Find out where I stand →",
};

// "People decide..." — physique before/after (skinny-fat → athletic)
const FIRST_IMPRESSION_PHYSIQUE: AdVariant = {
  badge: "First Impression Analysis",
  headline: "People decide how they'll treat you before you open your mouth.",
  subtext:
    "There is one variable that controls the first impression you make. Research found it. We built the protocol around it. 2 minutes to see yours.",
  cta: "Find out where I stand →",
};

// "This man is average" — story about the average man who goes to the gym, nobody notices
const AVERAGE_MAN: AdVariant = {
  badge: "Attractiveness Diagnostic",
  headline: "Don't be the man who trains for years and nobody notices.",
  subtext:
    "He thinks the problem is effort. It's not. There is one variable he has never measured. It drives how people perceive you more than anything else.",
  cta: "Find out what he should have done →",
};

// "From 5/10 to 9/10" — score visualization, "Thanks to a science-backed protocol"
const SCORE_UPGRADE: AdVariant = {
  badge: "Attractiveness Score",
  headline: "Find out if this protocol can take you from where you are to a 9/10.",
  subtext:
    "An assessment that gives you your current score and shows you exactly what it takes to go higher. Takes 2 minutes.",
  cta: "See if it works for me →",
};

// "What's wrong with this physique?" — massive bodybuilder, "Nothing if strength is your goal"
const STRENGTH_VS_ATTRACTIVENESS: AdVariant = {
  badge: "Attractiveness vs. Strength",
  headline: "What's wrong with this physique? Nothing, if your goal is strength.",
  subtext:
    "But if your goal is attractiveness, you need a completely different formula. One built around what research actually says the eye reads as attractive.",
  cta: "See the formula →",
};

// "Four Shapes One Man" — 4 body types scored: skinny-fat 34, overweight 42, bodybuilder 58, optimal 94
const FOUR_SHAPES: AdVariant = {
  badge: "Body Shape Analysis",
  headline: "Four shapes. One man. Only one maximizes your attractiveness score.",
  subtext:
    "Skinny-fat: 34/100. Overweight: 42/100. Bodybuilder: 58/100. Optimal shape: 94/100. A 2-minute assessment tells you exactly where you rank.",
  cta: "See where I rank →",
};

// "12 weeks — work variation" — office setting, ignored → leading the room
const TWELVE_WEEKS_WORK: AdVariant = {
  badge: "12-Week Protocol",
  headline: "12 weeks is how long it takes to change how people perceive you at work.",
  subtext:
    "Your body speaks before you do. This assessment tells you exactly what's holding your professional presence back and what to do about it.",
  cta: "Visualize my potential →",
};

// "12 weeks — bar variation" — bar scene, "change who approaches him"
const TWELVE_WEEKS_BAR: AdVariant = {
  badge: "12-Week Protocol",
  headline: "12 weeks is how long it takes to change who approaches you.",
  subtext:
    "Your body speaks before you do. This assessment tells you exactly what's holding you back socially and what to do about it.",
  cta: "Visualize my potential →",
};

// "What your mirror won't tell you" — body annotation overlay with data points
const MIRROR: AdVariant = {
  badge: "Body Scan",
  headline: "What your mirror won't tell you about your appearance.",
  subtext:
    "One photo. We measure your proportions, posture, and frame. Then tell you exactly what to train for attractiveness, not just muscle size.",
  cta: "Get my body scan →",
};

// "Scan your body" — bold "SCAN YOUR BODY", phone with protocol interface
const SCAN: AdVariant = {
  badge: "Body Scan",
  headline: "Scan your body. Get your exact protocol.",
  subtext:
    "One photo. Your proportions are measured and scored. The protocol follows directly from the results.",
  cta: "Get my analysis →",
};

// "Things I've tried to look better" — post-it note, crossed-out attempts
const POSTIT: AdVariant = {
  badge: "Your Body Blueprint",
  headline: "Stop trying things that don't work for your body.",
  subtext:
    "YouTube workouts. Eat more protein. Copy influencer routines. They don't work because they're not built for your structure. 2 minutes to find your blueprint.",
  cta: "Find my blueprint →",
};

// "Your body analyzed" — body silhouette diagram, Shoulder-to-Waist 59→78, Aesthetic Score 63→81
const BODY_ANALYZED: AdVariant = {
  badge: "Body Analysis",
  headline: "See your body analyzed: every proportion, score, and 12-week potential.",
  subtext:
    "An assessment that measures your exact proportions and tells you precisely what to change and what your score looks like in 12 weeks.",
  cta: "Analyze my body →",
};

// "Get Your Attractiveness Score" — tablet showing Connor's Protocol interface
const GET_SCORE: AdVariant = {
  badge: "Attractiveness Score",
  headline: "Get your attractiveness score, measured to the number.",
  subtext:
    "2 minutes. 18 variables measured. You get your score, what's pulling it down, and exactly what to do about it.",
  cta: "Get my score →",
};

// "Don't be like Donald" — "I look in the mirror and don't know what to fix anymore"
const DONALD: AdVariant = {
  badge: "Your Body Blueprint",
  headline: "Don't be like Donald. Your body has a blueprint. Are you training on the right one?",
  subtext:
    "Most men train off the wrong blueprint and see no results for years. 2 minutes to find out exactly what your body is actually built for.",
  cta: "See what my body is built for →",
};

// "3 months. Same gym. Different protocol." — side-view body scan, Aesthetic Score 63→84
const THREE_MONTHS: AdVariant = {
  badge: "Protocol Difference",
  headline: "3 months. Same gym. A different protocol changes everything.",
  subtext:
    "Same gym. Different training targets. Aesthetic Score: 63 → 84. What changed wasn't effort. It was knowing what to train for.",
  cta: "Build my protocol →",
};

// "After 5 years to study" — research/study-angle video
const FIVE_YEARS_STUDY: AdVariant = {
  badge: "Research Findings",
  headline: "After 5 years studying what makes men attractive, one variable explains most of it.",
  subtext:
    "A 2-minute assessment measures that variable, tells you your score, and shows you exactly what to do about it.",
  cta: "See my score →",
};

// "4 steps to look better" — step framework video
const FOUR_STEPS: AdVariant = {
  badge: "Body Improvement Protocol",
  headline: "There are 4 steps to looking better. Most men skip the most important one.",
  subtext:
    "The step most men miss has nothing to do with training harder. A 2-minute assessment identifies exactly where you are and what to fix first.",
  cta: "Find out where I am →",
};

// "We can show you your potential" — before/after potential reveal video
const SHOW_POTENTIAL: AdVariant = {
  badge: "Potential Analysis",
  headline: "We can show you exactly what your body is capable of in 12 weeks.",
  subtext:
    "Not a generic transformation. Your proportions, your structure, your ceiling. A 2-minute assessment maps it out.",
  cta: "Show me my potential →",
};

// "You have no idea how good your body could look" — untapped potential video
const BODY_POTENTIAL: AdVariant = {
  badge: "Body Potential",
  headline: "You have no idea how good your body could look. This changes that.",
  subtext:
    "Most men train without ever knowing their actual ceiling. A 2-minute assessment maps your proportions and shows you exactly how high you can go.",
  cta: "See my ceiling →",
};

// "4 steps to improve your attractiveness" — not strength, not endurance, attractiveness is the variable that changes how people treat you
const FOUR_STEPS_ATTRACTIVENESS: AdVariant = {
  badge: "Attractiveness Protocol",
  headline: "4 steps to improve your attractiveness — not your strength, not your endurance.",
  subtext:
    "Attractiveness is the one variable that changes how people treat you. Most men have never trained for it. This assessment tells you exactly where you stand on each of the 4 steps.",
  cta: "See my 4 steps →",
};

// "Same age. Same clothes. He gets the attention. You don't." — social comparison bar scene, "not charm, not luck, something no one talks about"
const SAME_ROOM_HE_WINS: AdVariant = {
  badge: "Social Presence Analysis",
  headline: "Same age. Same clothes. He gets the attention. You don't. Here's why.",
  subtext:
    "It's not charm. It's not luck. We eliminated every obvious answer. There's one variable that explains it — and it shows up before you speak. This assessment measures it.",
  cta: "Find out what he has →",
};

// "3 things holding you back & you can't name them" — effort frustration, "it's not discipline, it's 3 things you've never been told to look at"
const THREE_THINGS_HOLDING_BACK: AdVariant = {
  badge: "Blind Spot Analysis",
  headline: "3 things are holding you back. You've been putting in the work. None of them are effort.",
  subtext:
    "Training, eating well, staying consistent — and something still isn't clicking. It's not discipline. It's 3 specific variables you've never been told to look at. This assessment names them.",
  cta: "Name my 3 blind spots →",
};

// "You don't look like you lift" — 3 reasons: strength ≠ shape, gym is a guess, wrong variables
const DONT_LOOK_LIKE_YOU_LIFT: AdVariant = {
  badge: "Why You Don't Look Like You Lift",
  headline: "You train. Nothing shows. Here's which of the 3 reasons explains it.",
  subtext:
    "Strength ≠ shape. Every hour in the gym without the right targets is a guess. A 3-minute assessment measures the variables that actually control how your body looks — and tells you exactly which one to fix first.",
  cta: "Find my reason →",
};

// "The Research — Cristiano Ronaldo" — carousel: thousands of athletes equally fit, only he is one of the most attractive, face rates 6/10 alone, body elevates everything, 100+ markers none genetic
const RONALDO_RESEARCH: AdVariant = {
  badge: "The Research",
  headline: "Thousands of athletes share Ronaldo's fitness level. None share his attractiveness rating. The difference isn't effort — it's structure.",
  subtext:
    "His face alone rates a 6/10. Cover his body and show only his face — the rating drops. The 100+ markers that drive his score aren't muscle mass. They're specific proportions that fitness alone doesn't change. And not one of them is genetic.",
  cta: "Measure my markers →",
};

// "The Research — Henry Cavill" — carousel: Cavill analyzed, not the biggest in Hollywood (Rock/Hemsworth bigger), but proportions beat muscle mass, pattern can be engineered
const CAVILL_RESEARCH: AdVariant = {
  badge: "The Research",
  headline: "Henry Cavill isn't the biggest man in Hollywood. The Rock is bigger. Hemsworth is bigger. He just rates higher. Here's why.",
  subtext:
    "It's not muscle mass that drives the attractiveness rating — it's how everything lines up. Researchers mapped over 100 of these structural markers. Cavill's body hits most of them. That's a pattern. And patterns can be measured on yours.",
  cta: "Measure my pattern →",
};

// "The Research — Michael B. Jordan" — carousel: MBJ analyzed with 100+ markers, not his face, 5/10 face rating, body carries the score, same markers on yours
const MBJ_RESEARCH: AdVariant = {
  badge: "The Research",
  headline: "We ran Michael B. Jordan's body through 100+ attractiveness markers. We can run the same analysis on yours.",
  subtext:
    "It's not his face. It's not his muscle mass. It's a specific body structure that triggers attractiveness at a glance — and every man has the same markers. This assessment measures where yours stand.",
  cta: "Run my analysis →",
};

// "What makes a man's body attractive?" — research credibility, "Not strong. Not lean. Not big. Attractive."
const WHAT_MAKES_ATTRACTIVE: AdVariant = {
  badge: "Attractiveness Research",
  headline: "What actually makes a man's body attractive? We studied 2,500 men to find out.",
  subtext:
    "Not strong. Not lean. Not big. Attractive is a specific formula — one we found after reading 25,000+ papers and measuring 2,500 men. This assessment tells you where you stand.",
  cta: "See what makes me attractive →",
};

// "What makes a man's body attractive — 60+" — past 60, the formula shifts but still applies
const WHAT_MAKES_ATTRACTIVE_60: AdVariant = {
  badge: "Attractiveness Research · 60+",
  headline: "What makes a man's body attractive past 60? The formula shifts. It still applies.",
  subtext:
    "Proportion, posture and structural definition move how you're perceived now — not size. 2 minutes to see where yours stand.",
  cta: "See what makes me attractive →",
};

// "What makes a man's body attractive — Founder" — 80h weeks, presence in pitch rooms, efficient plan
const WHAT_MAKES_ATTRACTIVE_FOUNDER: AdVariant = {
  badge: "Attractiveness Research · Founders",
  headline: "What makes a body attractive on 80-hour weeks? Not more hours. The right ones.",
  subtext:
    "Founders don't fail for lack of effort — generic programs were never built around their schedule. 2 minutes to find the formula that fits yours.",
  cta: "See what makes me attractive →",
};

// "What makes a man's body attractive — 20-29" — fastest visible change window, peak adaptation
const WHAT_MAKES_ATTRACTIVE_20S: AdVariant = {
  badge: "Attractiveness Research · 20s",
  headline: "Your 20s are the fastest visible-change window you'll have. Don't waste it.",
  subtext:
    "Testosterone is near peak. Your body adapts faster now than it ever will again. 2 minutes to find the formula that locks in changes for decades.",
  cta: "See what makes me attractive →",
};

// "What makes a man's body attractive — Newly Single" — back in dating market
const WHAT_MAKES_ATTRACTIVE_DATING: AdVariant = {
  badge: "Attractiveness Research · Dating",
  headline: "Back in the dating market? You don't get a learning curve. You get first impressions.",
  subtext:
    "The body women respond to on a first date isn't built in the gym most guys train in. 2 minutes to see where you stand and what to fix first.",
  cta: "See what makes me attractive →",
};

// "What makes a man's body attractive — Gay" — what other men actually look at
const WHAT_MAKES_ATTRACTIVE_GAY: AdVariant = {
  badge: "Attractiveness Research",
  headline: "What makes a man's body actually attractive to other men? We studied it.",
  subtext:
    "Not strong. Not lean. Not big. Attractive is a specific structural formula — and most generic programs don't target it. 2 minutes to see where yours stands.",
  cta: "See what makes me attractive →",
};

// ─────────────────────────────────────────────────────────────────────────────
// Full mapping: ad_id → AdVariant
// ─────────────────────────────────────────────────────────────────────────────

export const AD_VARIANTS: Record<string, AdVariant> = {
  // Is the way people treat you fixable
  "120243946568580660": FIXABLE,

  // 3 reasons you're overlooked in social situations
  "120243947123120660": OVERLOOKED,

  // People decide... (bar scene before/after)
  "120243946726800660": FIRST_IMPRESSION_BAR,

  // This man is average
  "120243947143910660": AVERAGE_MAN,

  // People decide... (dressed man / corporate)
  "120243947232730660": FIRST_IMPRESSION_DRESSED,

  // People decide... (physique before/after)
  "120243946682270660": FIRST_IMPRESSION_PHYSIQUE,

  // From 5/10 to 9/10
  "120243946475600660": SCORE_UPGRADE,

  // What's wrong with this physique (Afro, bodybuilder) — two ad sets
  "120243912430250660": STRENGTH_VS_ATTRACTIVENESS,
  "120242906468400660": STRENGTH_VS_ATTRACTIVENESS,

  // Four Shapes One Man (Afro) — two ad sets
  "120243912430320660": FOUR_SHAPES,
  "120242906468440660": FOUR_SHAPES,

  // Four Shapes One Man (White) — two ad sets
  "120243912430330660": FOUR_SHAPES,
  "120242906468450660": FOUR_SHAPES,

  // 12 weeks — work variation — three ad sets (same image)
  "120243912430240660": TWELVE_WEEKS_WORK,
  "120242906468390660": TWELVE_WEEKS_WORK,
  "120242906468410660": TWELVE_WEEKS_WORK,

  // 12 weeks — bar variation
  "120242906468370660": TWELVE_WEEKS_BAR,

  // What your mirror won't tell you — two ad sets
  "120243912430350660": MIRROR,
  "120242965578470660": MIRROR,

  // Scan your body — two ad sets
  "120243912430360660": SCAN,
  "120242965578460660": SCAN,

  // Things I've tried to look better (Postit) — two ad sets
  "120243912430340660": POSTIT,
  "120242965578450660": POSTIT,

  // Your body analyzed (body silhouette diagram)
  "120242965578490660": BODY_ANALYZED,

  // Get Your Attractiveness Score
  "120242906468420660": GET_SCORE,

  // Don't be like Donald
  "120242906468430660": DONALD,

  // 3 months. Same gym. Different protocol.
  "120242965578480660": THREE_MONTHS,

  // After 5 years to study — two ad sets
  "120243912430230660": FIVE_YEARS_STUDY,
  "120242452036090660": FIVE_YEARS_STUDY,

  // 4 steps to look better — two ad sets
  "120243912430220660": FOUR_STEPS,
  "120242428657600660": FOUR_STEPS,

  // We can show you your potential — three ad sets
  "120243912430210660": SHOW_POTENTIAL,
  "120242428657580660": SHOW_POTENTIAL,
  "120242428657590660": SHOW_POTENTIAL,

  // You have no idea how good your body could look
  "120242906468380660": BODY_POTENTIAL,

  // "I found an AI tool..." video — falls back to DEFAULT (no variant added)

  // 4 steps to improve your attractiveness (not strength, not endurance)
  "120246733435030660": FOUR_STEPS_ATTRACTIVENESS,

  // Same age. Same clothes. He gets the attention. You don't. (bar social comparison)
  "120246741549040660": SAME_ROOM_HE_WINS,

  // 3 things holding you back & you can't name them (effort frustration)
  "120246744002840660": THREE_THINGS_HOLDING_BACK,

  // What makes a man's body attractive? (research credibility)
  "120246744499120660": WHAT_MAKES_ATTRACTIVE,

  // "You don't look like you lift" — 3 reasons why (strength ≠ shape, gym is a guess)
  "287082345723543": DONT_LOOK_LIKE_YOU_LIFT,

  // "The Research — Michael B. Jordan" — carousel, 100+ markers, body carries the score
  "120247400526060660": MBJ_RESEARCH,

  // "The Research — Henry Cavill" — carousel, not muscle mass, it's how everything lines up
  "120247400517590660": CAVILL_RESEARCH,

  // "The Research — Cristiano Ronaldo" — carousel, thousands equally fit, only he is most attractive, structural markers
  "120247400649040660": RONALDO_RESEARCH,

  // "What makes a man's body attractive — 60+" persona
  "120248216394460660": WHAT_MAKES_ATTRACTIVE_60,

  // "What makes a man's body attractive — Founder" persona (80h weeks)
  "120248216431520660": WHAT_MAKES_ATTRACTIVE_FOUNDER,

  // "What makes a man's body attractive — 20-29" persona (peak adaptation window)
  "120248216462410660": WHAT_MAKES_ATTRACTIVE_20S,

  // "What makes a man's body attractive — Newly Single" persona (dating market)
  "120248216483770660": WHAT_MAKES_ATTRACTIVE_DATING,

  // "What makes a man's body attractive — Gay" persona (same formula, men responding)
  "120248216509890660": WHAT_MAKES_ATTRACTIVE_GAY,
};

export function getAdVariant(adId: string | undefined): AdVariant {
  if (!adId) return DEFAULT_VARIANT;
  return AD_VARIANTS[adId] ?? DEFAULT_VARIANT;
}

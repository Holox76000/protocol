/**
 * Hardcoded testimonial library, indexed by persona tag.
 *
 * The LLM selects one of these IDs based on the detected persona. Testimonials
 * activate the same emotional mechanism as the user's situation WITHOUT quoting
 * or naming specific surfaces they mentioned.
 */

export type TestimonialId =
  | "romantic_sam"
  | "comparison_alex"
  | "longevity_james"
  | "identity_marcus"
  | "achiever_carl"
  | "event_david"
  | "general_default";

export type Testimonial = {
  id: TestimonialId;
  quote: string;
  name: string;
  meta: string;
};

const LIBRARY: Record<TestimonialId, Testimonial> = {
  romantic_sam: {
    id: "romantic_sam",
    quote:
      "I'd been at the gym for 4 years. Plenty of strength. But every time I tried to put myself out there, the photos didn't match the work. After 12 weeks the difference wasn't size, it was shape. The first round of photos since felt completely different.",
    name: "Sam, 32",
    meta: "Designer · Joined Sept 2025",
  },
  comparison_alex: {
    id: "comparison_alex",
    quote:
      "I started after seeing photos from a thing I'd been training for. I'd put in the work and the photos still made me cringe. The Protocol was the first plan that explained why my work wasn't translating. By week 8 the next batch was the first I actually wanted to keep.",
    name: "Alex, 36",
    meta: "Actor · Joined March 2025",
  },
  longevity_james: {
    id: "longevity_james",
    quote:
      "At 47 I was tired of plans built for 25-year-olds. The Protocol was the first time I trained with a 10-year horizon. Mobility, posture, the right kind of loading. 12 weeks in I'm stronger and I sleep better. That's the trade I was trying to make.",
    name: "James, 47",
    meta: "Corporate · Joined Jan 2026",
  },
  identity_marcus: {
    id: "identity_marcus",
    quote:
      "I wasn't looking for a transformation. I was looking for the structure I'd been missing for years. The Protocol gave me both. A clear sequence week by week, and a body that finally matched the work I was putting in everywhere else in my life.",
    name: "Marcus, 41",
    meta: "Consultant · Joined Nov 2025",
  },
  achiever_carl: {
    id: "achiever_carl",
    quote:
      "I run three things at once. I needed a plan that fit inside that life, not on top of it. The Protocol is the only structure I've found that respects how rare my training time is. 12 weeks, real results, zero friction with everything else.",
    name: "Carl, 35",
    meta: "Founder · Joined Feb 2026",
  },
  event_david: {
    id: "event_david",
    quote:
      "I had a specific deadline 14 weeks out and zero plan. The Protocol got me there. Not just lean, actually confident showing up. The clarity of 'do this exact thing this exact week' was what made it work for me.",
    name: "David, 38",
    meta: "Finance · Joined Aug 2025",
  },
  general_default: {
    id: "general_default",
    quote:
      "I've tried a lot of plans. Most of them assumed I had nothing else going on. The Protocol was different. It met me where I actually was, gave me a sequence I could follow, and 12 weeks later the body matched the rest of my life.",
    name: "Tom, 34",
    meta: "Entrepreneur · Joined Oct 2025",
  },
};

export function getTestimonialById(id: TestimonialId | null | undefined): Testimonial {
  if (!id) return LIBRARY.general_default;
  return LIBRARY[id] ?? LIBRARY.general_default;
}

export function allTestimonialIds(): TestimonialId[] {
  return Object.keys(LIBRARY) as TestimonialId[];
}

---
name: medical-saas-ui
description: Design modern, premium, conversion-focused SaaS interfaces for medical, wellness, clinic, aesthetic, and health-adjacent products. Use when Codex needs to create or refine a landing page, funnel, pricing page, onboarding, dashboard, patient portal, questionnaire, or broader UI direction for healthcare or well-being brands where trust, clarity, mobile usability, and credible conversion matter more than generic SaaS patterns.
---

# Medical SaaS UI

Design credible, high-conversion interfaces for medical and wellness SaaS with a premium clinical posture. Default to clarity, trust, and mobile-first conversion rather than trendy but fragile visual effects.

## Workflow

Follow this sequence before producing UI, copy direction, wireframes, or code.

1. Understand the offer.
   - Identify audience, promise, risk level, and whether the surface is marketing, product, or both.
   - Separate medical guidance, wellness guidance, and lifestyle framing. Do not blur them.
2. Calibrate the proof level.
   - Match the visual tone and copy confidence to the available proof: practitioner credibility, process transparency, testimonials, outcomes framing, or regulated claims.
   - Reduce claim intensity when evidence is weak or not provided.
3. Choose the conversion angle.
   - Prefer one dominant action per screen: book, start assessment, begin onboarding, continue plan, or upgrade.
   - Sequence reassurance before commitment on high-friction steps.
4. Build the hierarchy.
   - Lead with credibility, outcome framing, and low-friction next step.
   - Group related content into calm, legible sections with strong spacing and obvious reading order.
5. Verify trust, accessibility, and mobile.
   - Check contrast, type scale, tap targets, form length, error clarity, and whether the CTA remains obvious on small screens.

## Core Heuristics

- Prioritize credibility before visual flourish.
- Keep CTAs prominent but never aggressive or manipulative.
- Use social proof carefully: frame it as reassurance, not hype.
- Prefer short forms, progressive disclosure, and low cognitive load.
- Make the UI feel guided, not crowded.
- Keep navigation shallow on conversion surfaces.
- Use mobile-first layouts by default.
- Treat privacy, safety, and practitioner trust as part of the product experience, not footer-only details.

## Visual Direction

- Favor clear, light palettes with crisp neutrals, restrained accent colors, and strong contrast.
- Use typography with personality and authority, not default generic SaaS stacks.
- Prefer structured grids, generous white space, and modular cards with varied rhythm rather than repetitive dashboard tiles.
- Use motion sparingly: staged reveals, directional emphasis, and status transitions only when they improve comprehension.
- Add trust signals directly in the flow: practitioner profile, methodology, timeline, privacy note, response expectations.
- Avoid making the interface feel sterile. Premium clinical should feel warm, precise, and contemporary.

Load [references/visual-direction.md](references/visual-direction.md) when you need palettes, type pairings, layout patterns, or component-level direction.

## Anti-Patterns

- Do not imply medical certainty without support.
- Do not use dark mode as the default aesthetic for this domain unless the existing product already depends on it.
- Do not overuse gradients, glassmorphism, neon, or generic AI-health tropes.
- Do not stack dense KPI cards, complex tables, or multi-column forms on mobile-first flows.
- Do not use pseudo-scientific copy, pressure tactics, countdowns, or exaggerated before/after framing.
- Do not ship a landing page that looks like a generic B2B SaaS template with health copy pasted in.

## Surface Guides

- For landing pages, pricing, quizzes, booking funnels, and treatment or program pages, read [references/landing-patterns.md](references/landing-patterns.md).
- For onboarding, patient or member portals, dashboards, and health forms, read [references/app-patterns.md](references/app-patterns.md).
- For CTA sequencing, objection handling, and friction reduction, read [references/conversion-checklist.md](references/conversion-checklist.md).
- For safe tone and non-deceptive outcome framing, read [references/compliance-tone.md](references/compliance-tone.md).

## Reusable Assets

- Use `assets/marketing-starter/` for a premium clinic or wellness landing page baseline.
- Use `assets/app-starter/` for onboarding and dashboard structure.
- Use `assets/sections/` when assembling hero, trust, protocol, FAQ, booking, or social-proof sections quickly.

## Script

- Run `scripts/ui_brief.py` to turn a rough product prompt into a structured UI brief before designing or coding.

# Changelog

All notable changes to Protocol Club are documented in this file.
Format: [MAJOR.MINOR.PATCH.MICRO] - YYYY-MM-DD.

## [1.1.2.0] - 2026-07-18

### Added
- Real photos on the dating landing page: the hero is now a full-bleed 2×2
  photo wall (casual, outdoor, night out, athletic) and the "5 styles" cards
  show the same real shots — visitors see actual output instead of colored
  placeholders.

### Changed
- The "Matches/week 9 → 47" stat card now straddles the bottom edge of the
  photo wall; hero headline sits closer to the nav; the "AI photo studio"
  eyebrow and the footer "part of Protocol Club" mention are gone.

### Fixed
- Hero photos are preloaded so the first paint doesn't wait on the stylesheet
  (faster LCP for paid mobile traffic).
- Tablet widths (600–1023px) no longer crop faces out of the hero tiles;
  narrow desktops (1024–1179px) no longer hide a press logo under the stat
  card.
- The bottom checkout bar shows a single variant per screen size — the desktop
  pill no longer stacks on top of the mobile bar on phones.

## [1.1.1.0] - 2026-07-12

### Added
- "Old way → new way" comparison on the dating landing page: booking a $400
  half-day photographer vs an AI-trained photographer's eye at $39 — visitors
  see the price, speed and volume trade-off side by side before pricing.

### Fixed
- Comparison cards pass contrast checks (tags, list marks) and read cleanly
  in screen readers; card copy no longer contradicts itself on photo counts.

## [1.1.0.0] - 2026-07-10

### Added
- **Protocol Dating** — a second product line at `/dating`: AI-generated dating
  profile photos ($39 one-time, 30 photos, 5 styles, 24h delivery). Landing page
  with research, styles, founder story and personalization sections; direct
  Stripe checkout; post-payment photo upload at `/dating/success` (browser
  uploads go straight to storage via signed URLs, 6–12 photos); order
  confirmation email with upload link; Slack notification when a customer
  finishes uploading.
- Dating funnel tracking end-to-end: Meta Pixel/CAPI ViewContent &
  InitiateCheckout & Purchase at $39 with dedicated content ids, GA4 events,
  TikTok events — fully separated from the f1 funnel's $89 signals.
- `dating_orders` table (migrations 022–023) with row-level security enabled
  and a status state machine (`paid → photos_uploaded → delivered`).
- New intro-slide personalization for the "gay beauty standard — bear" Meta
  carousel (ad 120249601537790660): visitors from that ad land on copy that
  continues the ad's promise.
- Unit test coverage for the checkout line items, dating order helpers,
  ad-variant lookup and confirmation email (80 → 100 tests).

### Fixed
- Upload flow hardened after adversarial review: race-proof photo storage
  (unique filenames, storage-derived counts), idempotent order completion,
  payment-status gate on the Stripe webhook (async payment methods can no
  longer trigger a confirmation email before money settles), retry on the
  success-page order fetch.
- Realigned report-content tests with the universal pattern copy (stale
  assertions from the copy rewrite).

# Changelog

All notable changes to Protocol Club are documented in this file.
Format: [MAJOR.MINOR.PATCH.MICRO] - YYYY-MM-DD.

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

# Changelog

All notable changes to Protocol Club are documented in this file.
Format: [MAJOR.MINOR.PATCH.MICRO] - YYYY-MM-DD.

## [1.1.4.3] - 2026-08-02

### Changed
- Dating gallery photo links now stay valid for 7 days (was 1 hour). The gallery
  page already regenerates fresh links on every load, so returning to
  `/dating/gallery?session_id=…` days later already worked; this also covers a
  tab left open or a saved/shared photo link — a customer can come back well
  beyond 3 days without a broken link.

## [1.1.4.2] - 2026-07-31

### Fixed
- Dating generation now survives Nano Banana rate limits. At 30-47 images per
  order the image API throttles (429): one order finished 30/30 in 150s while
  another managed only 5/30 in 15 min before the background function timed out.
  Two changes: (1) **resumable generation** — `generateForOrder` lists the images
  already in `orders/{sid}/output/` and skips them, so a throttled/killed run
  resumes where it left off (converging across the cron's 30-min resurrection
  instead of regenerating all images every time); (2) the Nano Banana retry now
  **honours the `Retry-After` header** and does 4 attempts (was 3), backing off
  exactly as the provider asks under throttling.

## [1.1.4.1] - 2026-07-31

### Fixed
- Netlify Functions bundling failed for the new `dating-generate-bg-background`
  function ("Could not resolve server-only"): it pulls in `lib/email.ts`, which
  imported `createUnsubscribeToken` from `lib/auth.ts`, and `lib/auth.ts` starts
  with `import "server-only"` — unresolvable by the esbuild function bundler.
  Moved `createUnsubscribeToken` / `verifyUnsubscribeToken` into a new
  `server-only`-free `lib/unsubscribeToken.ts` (re-exported from `lib/auth` for
  existing importers) so the email path bundles cleanly into standalone functions.
  This unblocks the v1.1.4.0 background-generation fix.

## [1.1.4.0] - 2026-07-31

### Fixed
- Dating photo generation failed with "Unexpected token '<' … is not valid JSON"
  after the active-template count grew to 30 (47 with the luxury upsell). One
  Nano Banana call per template exceeded the 60s serverless timeout, so the
  platform returned an HTML 504 that the admin UI / cron tried to parse as JSON.
  Generation now runs in a Netlify background function (15-min limit,
  `netlify/functions/dating-generate-bg-background.mts`): the admin action route
  and the cron claim the order to `generating` then hand off; the admin UI
  refreshes to show photos as they land. Local dev still runs inline.

## [1.1.3.1] - 2026-07-29

### Changed
- Deploy notifications now mention the whole channel (`@channel`) so the plain-
  language note reaches everyone in #news, instead of posting silently.

## [1.1.3.0] - 2026-07-29

### Fixed
- Inbound customer emails mirrored to Slack now show the actual message body
  instead of "(message body unavailable)". The webhook fetched the body via a
  method that does not exist in the Resend SDK (`resend.inbound.get`); it now
  uses the correct `resend.emails.receiving.get(id)` path. Regression test added.

### Added
- Wiki: new "Précédentes itérations" section (`docs/11-tests-realises.md`) that
  archives the retired Protocol (attractiveness/body) product — funnel, quiz,
  scoring, report, PDF, pricing, tracking. The live wiki pages now describe only
  Protocol Dating.
- Deploy protocol: after every deploy, update the wiki and post a plain-language
  Slack notification to the deploy channel with a link to the relevant doc page.
  New internal endpoint `app/api/notify-deploy` (bot-token post, auth via
  CRON_SECRET/BG_FN_SECRET), `scripts/notify-deploy.ts`, and a mandatory
  "Après chaque deploy" convention in `CLAUDE.md`.

### Changed
- Wiki pages 01–10 refocused on the single live product (Dating); all
  Protocol/attractiveness detail moved to Précédentes itérations.

## [1.1.2.1] - 2026-07-19

### Changed
- Dating "How it works" step 1 now announces the short questionnaire: a few
  questions about your style and your life, so the photos genuinely look like
  you — not just any set of good-looking shots.

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

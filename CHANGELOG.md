# Changelog

All notable changes to Protocol Club are documented in this file.
Format: [MAJOR.MINOR.PATCH.MICRO] - YYYY-MM-DD.

## [1.4.0.1] - 2026-08-28

### Fixed
- **`/nose` — recalibrated the hump/bridge/tip callout dots** so they sit on the
  actual nose profile (the "tip" dot was landing off the nose, in the
  background). Applied to both before/after photos; verified desktop + mobile.

## [1.4.0.0] - 2026-08-28

### Changed
- **"Show, don't tell" pass across the four idea-test landings.** Where a page
  was explaining a fact in prose, it now *shows* it as a concrete interface
  artifact so it reads at a glance. Layout/type/CTAs unchanged, copy claims
  preserved.
  - **All 4 — cost/time compare bars** above each "old way → new way" table
    (a full grey "old" bar vs a short accent "new" bar): abs $600/mo → ~$39,
    jewelry $50–150 → $4.99 + 1 week → 24 h, nose $150–500 → $2.99 + wait → 24 h,
    bluffai hours → 60 sec. New shared `components/CompareBars`.
  - **`/abs`** — the "six things you get" list now annotates the real scan report
    ①→⑥; a body-fat threshold gauge; abdominal anatomy schemas; two diverging
    starter plans (28% vs 15% body fat); a 7-day schedule strip; numeric result
    chips on testimonials; a "same routine → two outcomes" pivot visual.
  - **`/bluffai`** — a pick→upload→60-sec visual flow; a 0:00→0:58 chrono; a
    larger before/after "spot the fake" proof; "+54 more" template ghost tiles;
    a trial billing timeline (Today $0 → Day 3 reminder → $6.99/wk) and a
    "reply cancel" mock.
  - **`/nose`** — hump/bridge/tip callouts pinned on the real before/after
    photos; a good/bad photo ✓/✕ guide; a "filters wreck the face" triptych; a
    surgeon-ready PDF mock; a nose-region schema; a $9K–20K price-range bar; and
    a variant comparison strip (real before + four AI-generated options: hump
    removed / tip refined / bridge smoothed / ethnic-preserving).
  - **`/jewelry`** — the "on paper" section now renders a full annotated
    appraisal sheet; a fair-market value gauge (pawn ↓ · fair-market · retail ↑);
    a cost-vs-value bar; a scan-app-vs-GemCheck output comparison; and a
    "hallmarks decoded" strip with real generated stamp macros (585 → 14k gold,
    maker's mark). New assets in `public/nose/variants/` and
    `public/jewelry/hallmarks/`, generated via nano-banana.

## [1.3.0.0] - 2026-08-28

### Changed
- **`/nose` and `/bluffai` now use real generated imagery.** `/nose` shows a
  real before/after profile pair (same face, only the nose reshaped) in the hero
  and the "Same face, different nose" section. `/bluffai` shows a real
  before/after forearm (plain → fake tattoo) inside the iMessage mock, plus a
  six-card gallery of real prank renders (fake tattoo, fake couple, aged, bald,
  new hair color, cartoon). All generated via nano-banana (Gemini image) on our
  own aesthetic, composed inside our own CSS. Web-sized JPGs in `public/nose/`
  and `public/bluffai/`.
- **Per-page DA accent color across the four idea-test landings.** Each vertical
  now carries a simple accent that threads through the hero headline emphasis,
  section-title emphasis, the "what you get" grid and the verified-purchase
  marks — abs = green, bluffai = violet, nose = clinical blue, jewelry = gold.
  Layout, type and CTAs are unchanged; it's a one-variable retint per page.
- **`/jewelry` diamond-rivière necklace value corrected** to $8,500–$12,000
  (the prior $4,200–$5,600 range was too low for the piece shown).

## [1.2.2.0] - 2026-08-27

### Changed
- **`/jewelry` now uses real generated imagery.** The hero "Appraisal Report"
  card shows a real generated Art Deco ring as the scanned item (framed), and a
  new "From heirlooms to yard-sale finds" gallery shows five appraised pieces
  (ring, necklace, brooch, watch, earrings) each with a fair-market value range.
  All photos generated via nano-banana (Gemini image) on our own studio
  backdrop, composed inside our own CSS so text/values stay crisp. Web-sized
  JPGs in `public/jewelry/`. Placeholder markers removed from the `/jewelry`
  visuals now that they carry real assets.

## [1.2.1.0] - 2026-08-27

### Changed
- **`/abs` result visuals are now real generated imagery instead of CSS/SVG
  mock-ups.** The hero "Abs Scan Report" and the scan→plan cards use our own
  images generated via nano-banana (Gemini image) from our own assets: a lean
  torso as the scan subject (hero + zone scan) and per-exercise thumbnails in
  the plan (hanging leg raises, reverse crunches, flutter kicks). Composed
  inside our own CSS interface so all text/scores stay crisp and on-brand.
  Images are web-sized (`public/abs/*.jpg`). Body-fat estimate recalibrated to
  13–15% to match the visible-abs imagery. Placeholder markers removed from the
  `/abs` visuals now that they carry real assets.

## [1.2.0.0] - 2026-08-27

### Added
- **Experiment landing framework** (`lib/experiments.ts`): a registry that drives
  Stripe line items, checkout success/cancel URLs, the confirmation email, and
  Meta/TikTok/GA4 product data for painted-door test verticals. Adding an idea is
  now one registry entry plus one route folder — no per-funnel branches to touch.
- **Four painted-door test landings**, each a subscription paywall cloned from the
  `/dating` format (plan selector, success page, per-vertical result mock-up):
  - `/abs` — Protocol Abs, AI abs analysis + adaptive plan. Weekly $8.99 / Monthly
    $11.99 / Yearly $34.99.
  - `/bluffai` — Bluff AI, AI prank photo editor. Weekly $6.99 with a 3-day free
    trial / Yearly $39.99.
  - `/nose` — NoseLab, AI rhinoplasty preview. Weekly $2.99 / Yearly $17.99.
  - `/jewelry` — GemCheck, AI jewelry identifier + value. Weekly $4.99 / Yearly $34.99.
- **Subscription + free-trial support** in the shared checkout: `mode:subscription`,
  per-plan `recurring.interval`, and `trial_period_days`. The Stripe webhook accepts
  `no_payment_required` so free-trial signups are still confirmed; the confirmation
  email is interval-neutral and trial-aware.
- **Dev-only image placeholders** (`components/ImagePlaceholder.tsx`) flagging every
  mock visual still to be swapped for a real asset. Scoped to
  `html[data-env="development"]`, so production ships without them.

## [1.1.8.1] - 2026-08-07

### Added
- **TikTok `AddToCart` event on every `/dating` CTA click.** Clicking any dating
  CTA (`Get my 30 photos — $39`: nav, hero, steps, before/after, pricing, sticky)
  now fires a TikTok `AddToCart` — a higher-funnel, more frequent optimization
  signal than `InitiateCheckout` (which only fires once the Stripe session is
  created). Sent both via the browser pixel (`lib/tiktokPixel.ts`) and server-side
  CAPI (`/api/track`), sharing one `event_id` for TikTok dedup, matching the
  existing `ViewContent`/`CompletePayment` pattern. Product `dating-ai-photos`,
  $39 USD. Gated on `funnel === "dating"`, so the F1 funnel is unaffected.

## [1.1.8.0] - 2026-08-04

### Security
- **Payment amount can no longer be set by the client.** `/api/update-payment-intent`
  now recomputes the price entirely server-side (base − re-validated promo + rush)
  and refuses intents it didn't create or that are already paid; it previously
  trusted a client `discountedBase`, letting anyone pay $0.50 for an $89 product.
  `/api/apply-promo` gets the same ownership/status guard, and the Stripe webhook
  alerts on any settled amount below a sanity floor.
- **Removed the account-takeover path in `/api/auth/register`.** Paid access is now
  granted only via the emailed single-use registration token; matching a typed
  email to a Stripe customer no longer grants `has_paid` (that let anyone claim a
  paying customer's account and PII).
- **Rate limiting** added to unauthenticated, cost-bearing endpoints (`/api/lead`,
  `/api/funnel/generate-preview`, `/api/visualize`) and login moved to a shared,
  persistent limiter (`lib/rateLimit.ts` + migration `033_rate_limits.sql`) instead
  of a per-instance in-memory counter.
- Shortened the funnel photo-preview signed URL from 10 years to 1 hour; removed
  PII from `/api/lead` logs; stopped committing `tsconfig.tsbuildinfo` and
  `supabase/.temp`.

### Changed
- Bumped Next.js 14.2.5 → 14.2.35 (includes the fix for CVE-2025-29927, the
  middleware authorization-bypass vulnerability).
- The dating Stripe webhook now returns 5xx (so Stripe retries) when persisting the
  order fails, instead of silently returning 200 and losing a paid order.

## [1.1.7.0] - 2026-08-04

### Changed
- Activated the (previously dormant) server-side TikTok Events API and pointed
  the whole TikTok integration at the new pixel `D9OSILJC77U7RKPO8F3G` (was
  `D8RKQNRC77UFFED96BL0`) — client pixel in `app/layout.tsx`, the
  `DEFAULT_PIXEL_ID` fallback, and env (`TIKTOK_PIXEL_ID` / `TIKTOK_ACCESS_TOKEN`
  in `.env.local` + Netlify prod). The Events API was fully wired but skipped
  every call because no access token was set.
- Fixed the TikTok purchase event name: `Purchase` → `CompletePayment` (TikTok's
  standard payment event; "Purchase" is Meta's name and registered as a custom
  event on TikTok, so it didn't feed purchase optimization). Applied to the
  browser pixel (`tiktokTrackPurchase`) and both server Purchase paths in the
  Stripe webhook. Meta keeps "Purchase" (its correct standard name).

### Added
- TikTok `CompletePayment` server event for the dating upsells ($20 priority /
  $20 luxury), mirroring the existing Meta CAPI upsell event — own event_id (the
  upsell PI) so it doesn't dedupe against the $39 purchase.

## [1.1.6.1] - 2026-08-04

### Changed
- Dating urgency bar is now day-aware: Mon–Thu it shows "Order now — get your
  matches for the weekend" instead of the price countdown (24h delivery + a
  couple days of matches still land before the weekend). Fri–Sun keep the
  "$39 launch price → $59" countdown (Fri is too tight to promise the weekend).
  Day is read client-side after mount → no SSR hydration mismatch.

## [1.1.6.0] - 2026-08-04

### Added
- Dating hero headline is now weekday-aware: Mon–Fri, broad/direct visitors see
  "Photos that get matches before the weekend." (Sat–Sun falls back to the
  evergreen "Photos that get you matches." — the line that already converts, and
  "before the weekend" makes no sense once you're in it). Ad-specific variants
  still win. Day is read client-side after mount, so there's no SSR hydration
  mismatch.
- Weekday-only "New photos today. Matches by the weekend." timeline section under
  the hero (Today → +24h → the weekend), planting the run-up-to-the-weekend frame.
  Hidden Sat–Sun.

### Changed
- Dating hero photo grid tiles are now square instead of tall "story" crops; the
  panel hugs the square block on mobile, tablet, and desktop.
- Shrunk the "matches / week 9 → 47" stat card so it stops eating the photo wall.
- More breathing room in the mobile hero headline/subhead block (looser spacing
  and line-height).

## [1.1.5.7] - 2026-08-04

### Changed
- Dating hero photo grid: replaced the weaker "night out" and "outdoor" model
  shots — the grid now shows Casual, Outdoor (the on-the-boat shot from the
  transformation section), Athletic, and Lifestyle (helicopter). Scoped to the
  hero; the styles section below is unchanged.

## [1.1.5.6] - 2026-08-04

### Changed
- Dating generation now weaves the customer's questionnaire answers to "How
  would you describe your style?" and "Where do you feel most yourself?" into
  every scene prompt (full batch + single-photo regenerate), biasing wardrobe/
  grooming/mood toward the customer while keeping the template scene unchanged.

## [1.1.5.5] - 2026-08-03

### Added
- Dating upsells ($20 priority / $20 luxury) now fire a Meta CAPI Purchase
  event with their own value and event_id (distinct from the $39 order), so Meta
  value optimization sees the upsell revenue. Attribution (utm/email) is pulled
  from the parent order.

## [1.1.5.4] - 2026-08-03

### Changed
- Mobile dating hero: the photo grid now flexes to fill the first screen (big,
  legible photos) and the Trustpilot badge sits right at the fold as the last
  visible element. Slightly smaller CTA. Verified at 390×844 and 360×740.

## [1.1.5.3] - 2026-08-03

### Changed
- Dating LP hero subline reworded to "Trained on thousands of top dating
  profiles. 30 photos shot like theirs, delivered in 24h." (desktop + mobile).

## [1.1.5.2] - 2026-08-03

### Changed
- Dating LP: removed the "N photo sets delivered today" counter and the "Only N
  production spots left today" line (both were simulated). The launch-price
  countdown, struck $59, and Verified-purchase badges stay. On mobile the hero
  photo grid is now larger (250px) so the sample photos read clearly.

## [1.1.5.1] - 2026-08-03

### Changed
- Mobile: the entire /dating hero (headline, description, style grid, CTA,
  Trustpilot + "delivered today" proof) now fits within the first screen on
  mobile — tighter type/spacing, a shorter visual panel, and the redundant
  ghost link + meta line hidden on mobile. Verified above the fold at 390×844
  and 360×740.

## [1.1.5.0] - 2026-08-02

### Added
- Dating LP urgency + social proof:
  - Top bar: **$39 launch price** with a live countdown to the **$59** bump, plus
    "Only N production spots left today" (N trends down through the day, coherent
    with 24h delivery).
  - Hero: a subtle live "N photo sets delivered today" counter (grows through the
    day) as volume social proof.
  - Pricing card: struck-through **$59** next to $39 and a "rising to $59 in 3
    days" tag.
  - Testimonials: a green **Verified purchase** marker under each review.

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

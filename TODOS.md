# TODOS

Items deferred from feature reviews. Pick up from here.

---

## P1 — Protocol Dating (deferred from v1.1.0.0 ship review)

### Hosted checkout ignores the dating funnel
**What:** `app/checkout/hosted/page.tsx:5` has its own `KNOWN_FUNNELS` set without `"dating"` — a `/checkout/hosted?funnel=dating` link silently coerces to `"main"` and charges **$19 instead of $39**. Also reject `embedded: true` + `funnel: "dating"` in `create-checkout-session` (return_url goes to the auth-gated /dashboard and the PI gets no metadata → double CAPI).
**Effort:** S (CC: ~10 min) · **Priority:** P1

### Browser-side Purchase pixel on /dating/success
**What:** Dating purchases are CAPI-only for Meta/TikTok — no browser `fbq('track','Purchase')` / TikTok pixel on the success page (f1's `/checkout/success` fires both, deduped by session id). Lower EMQ exactly on the campaign whose optimization depends on Purchase signal quality.
**Where:** `app/dating/success/DatingSuccessPage.tsx` — mirror `app/checkout/success/page.tsx`.
**Effort:** S (CC: ~15 min) · **Priority:** P1

### Session id is a write-capability bearer token leaked to analytics
**What:** `cs_live_...` in the /dating/success URL grants order reads + uploads + completion; GA4/Meta pixels auto-capture full URLs. Strip via `history.replaceState` after read, or mint a dedicated upload token column. Also cap user-supplied UTM values at 500 chars and mirror only the fields the Slack ping reads (funnel, utm_source/campaign/content) into PI metadata instead of full sharedMetadata (customer_ip/UA/ttp = PII in an extra Stripe surface).
**Effort:** M (CC: ~30 min) · **Priority:** P1

---

## P2 — Protocol Dating (deferred from v1.1.0.0 ship review)

### Robustness batch
- Rate limiting on `/api/dating/*` (anonymous, each miss fans out to Stripe) — pattern exists on `/api/auth/login`.
- Webhook: upsert the order (fast, idempotent) BEFORE the 3 sequential ad-API awaits; add idempotency to the confirmation email (redelivery re-sends it today).
- Slack #sales pings for dating PIs show "(no email)" — enrich from session in the webhook.
- Shared products constant (name/id/value duplicated across 5 files; `content_name` already inconsistent: "Protocol Dating" vs "— AI Dating Photos").
- Dedup `dating_orders` upsert (webhook vs `lib/datingOrders.ts`); shared MIN/MAX_PHOTOS + 10MB constants (client + serveur) ; type `DatingOrderStatus`.
- HTML-escape `firstName` in all `lib/email.ts` templates (forwardable-phishing primitive).

### UX/design batch (verify visually at 390/430px)
- Mobile hero: `.dt-hero-grid` may clip in the 280px `mo-hero-v1__right` panel; "Matches/week" card overlaps a tile label.
- Hero CTA spinner invisible (white-on-white inside `.mo-hero .mo-cta`).
- `.dt-upload-add` hover/focus state; FAQ rows are clickable divs (fix f1 + dating together, a11y).
- Success page: reload mid-upload shows count without thumbnails (render placeholder tiles); counter reads "8/6 minimum" past the min; HEIC previews break in Chrome (placeholder tile for heic/heif).
- Hero copy duplicated desktop/mobile (extract HeroCopy/HeroMeta).

---

## P3 — Protocol Dating (deferred from v1.1.0.0 ship review)

- Perf: `/dating` imports ~101KB of f1 CSS for a subset of `.mo-*` rules — extract shared styles; split the 695-line client LP into server sections + client islands (CheckoutButton, DFaq, DSticky); parallel uploads with bounded concurrency (safe now that filenames are unique and counts storage-derived).
- Tests: `lib/analytics.ts` dating branch via jsdom pragma; negative paths (Stripe client null, upsert failure, resend error, empty firstName); `vi.resetAllMocks` + `afterEach(unstubAllEnvs)` hygiene.
- Scripts: shared `.env.local` loader (73 copies under scripts/); drop `META_ACCESS_TOKEN` fallback in `fetch-ad-creative.ts` (CAPI token lacks ads_read).

---

## P2 — PDF Export (Phase 2)

### Client self-serve PDF via email
**What:** When a client wants their protocol as a PDF, they trigger it from their account page. The server generates the PDF and sends it as an email attachment via Resend to their registered email. No browser download for the client — email delivery only.
**Why:** Closes the loop for the client without requiring admin involvement. The admin flow (browser download) is already shipped separately.
**Pros:** Client autonomy, zero admin burden for PDF delivery, natural fit with existing Resend email infrastructure.
**Cons:** Resend attachment size limit (~10MB — fine for a 1-3MB PDF). Requires a new non-admin auth route.
**Context:** Two flows were intentionally separated: (1) admin downloads PDF locally → already built in this sprint; (2) client triggers email delivery → this TODO. Do NOT auto-send on protocol delivery — client-initiated only.
**Where to start:** `app/api/user/send-pdf/route.ts` — JWT auth via Supabase session cookie, calls `renderToBuffer(<ProtocolPDF />)`, passes buffer to Resend `attachments`. See `lib/email.ts` for existing Resend usage.
**Effort:** M (human ~1 day | CC: ~30 min)
**Priority:** P2
**Depends on:** PDF Export v1 (admin download) must ship first — shares the same `ProtocolPDF.tsx` template.

---

### PDF download button on mobile
**What:** The "Download PDF" button lives in `rsp-topbar` which is `display:none` on mobile. Add the button to the mobile header area so admins can trigger PDF generation from mobile too.
**Why:** The report is often reviewed on mobile. Blocking PDF export to desktop-only is inconsistent.
**Where to start:** `app/protocol/ProtocolSidebarLayout.tsx` — the mobile header section (around the burger menu / section title row).
**Effort:** S (human ~1h | CC: ~10 min)
**Priority:** P2
**Depends on:** PDF Export v1

---

### BF% silhouette vector in PDF
**What:** Render the BF% silhouette comparison (NOW vs TARGET torsos, bezier curves) as react-pdf SVG primitives inside the Body Analysis section of the PDF.
**Why:** The web layout has this visualization — matching it in the PDF makes the document feel complete.
**Context:** The web version uses inline SVG with cubic bezier paths. react-pdf's `<Svg>` supports `<Path>` with bezier commands — it's translatable. The waist half-width formula: `waistHW = 26 + Math.max(0, Math.min(1, (bf - 6) / 28)) * 18`.
**Where to start:** `app/pdf/sections/BodyAnalysisSection.tsx` — add `<BfSilhouettePDF>` component after the metric chips grid.
**Effort:** S (human ~3h | CC: ~15 min)
**Priority:** P3
**Depends on:** PDF Export v1

## Completed

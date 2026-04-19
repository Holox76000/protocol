# TODOS

Items deferred from feature reviews. Pick up from here.

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

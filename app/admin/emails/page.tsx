import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import EmailsClient from "./EmailsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resend webhook event types → friendly buckets.
type Bucket = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "failed";

function bucketFor(type: string): Bucket | null {
  switch (type) {
    case "email.sent":          return "sent";
    case "email.delivered":     return "delivered";
    case "email.opened":        return "opened";
    case "email.clicked":       return "clicked";
    case "email.bounced":       return "bounced";
    case "email.complained":    return "complained";
    case "email.failed":        return "failed";
    default: return null;
  }
}

// Subject lines → email role mapping. Identifies which nurture / cart
// email each event belongs to so we can aggregate per role.
type EmailRole =
  | "report" | "cart_e1" | "cart_e2"
  | "nurture_e2" | "nurture_e3" | "nurture_e4" | "nurture_e5" | "nurture_e6" | "nurture_e7"
  | "other";

// Subject patterns for E3 = patterns.p2t (one per morphology), see lib/report-content.ts.
// Cart E2 ALSO uses these same p2t subjects — we disambiguate later via timestamps in
// `users.cart_email_2_sent_at` and `leads.nurture_e3_sent_at`.
const P2T_SUBJECTS = [
  "your clothes are working against you",
  "your waist is what's controlling your silhouette",
  "visceral fat is flattening your v-taper",
  "proportions move the score",
];

function rawRoleForSubject(subject: string | null): EmailRole {
  const s = (subject ?? "").toLowerCase();
  if (s.includes("preliminary report is ready"))                                 return "report";
  if (s.includes("body analysis is waiting"))                                    return "cart_e1";
  if (s.includes("still thinking") || s.includes("preliminary report couldn't")
      || s.includes("protocol projection — last call"))                          return "cart_e2";
  if (s.includes("last email"))                                                  return "nurture_e7";
  if (s.includes("your projection"))                                             return "nurture_e6";
  if (s.includes("executive presence") || s.includes("signaling in rooms") ||
      s.includes("composed-not-muscular target") || s.includes("term-by-term") ||
      s.includes("you know the literature") || s.includes("looking strong and looking sharp") ||
      s.includes("what your environment changes"))                                return "nurture_e5";
  if (s.includes("12 weeks later"))                                              return "nurture_e4";
  if (P2T_SUBJECTS.some(p => s.includes(p)))                                     return "nurture_e3";
  if (s.includes("trainer wasn't aimed") || s.includes("youtube failed") ||
      s.includes("diets shrink") || s.includes("zero-baseline advantage") ||
      s.includes("one variable isn't the answer") ||
      s.includes("what you've tried wasn't built"))                              return "nurture_e2";
  return "other";
}

const ROLE_ORDER: EmailRole[] = [
  "report", "nurture_e2", "nurture_e3", "nurture_e4", "nurture_e5",
  "nurture_e6", "nurture_e7", "cart_e1", "cart_e2", "other",
];

const ROLE_LABELS: Record<EmailRole, string> = {
  report:     "E1 · Report delivery",
  nurture_e2: "Nurture E2 · Wedge",
  nurture_e3: "Nurture E3 · Insight",
  nurture_e4: "Nurture E4 · Mirror",
  nurture_e5: "Nurture E5 · Stakes",
  nurture_e6: "Nurture E6 · Projection",
  nurture_e7: "Nurture E7 · Breakup",
  cart_e1:    "Cart +10min",
  cart_e2:    "Cart +4h",
  other:      "Other / transactional",
};

// Internal emails (team / test accounts). Mirrors the filter used by Stripe
// `revenue` tool so the email dashboard matches the rest of the admin panel.
const INTERNAL_EMAIL_PATTERNS = [
  "patrypierreandre",
  "sofiane.lekfif",
  "sofiane@reddotgrowth",
  "thibault.cdn",
  "reddotgrowth",
];

function isInternalEmail(email: string): boolean {
  const e = email.toLowerCase();
  return INTERNAL_EMAIL_PATTERNS.some(p => e.includes(p));
}

export type RoleMetrics = {
  role: EmailRole;
  label: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  ctr: number;

  // Loose attribution: recipients of this role who ever paid (regardless of when).
  // Kept for historical comparison — will double-count if a user got multiple emails.
  paid: number;
  conversionRate: number;
  revenueCents: number;

  // Causal attribution: only recipients who paid AFTER receiving this email.
  // Excludes test/internal emails. This is the honest number.
  paidAfter: number;
  revenueCentsAfter: number;
};

// Within this window we consider two timestamps to be "the same send".
// Used to disambiguate Cart E2 ↔ Nurture E3 (shared subjects).
const MATCH_WINDOW_MS = 60_000;

function ms(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
}

export default async function EmailsPage({ searchParams }: { searchParams?: { range?: string } }) {
  await requireAdmin();

  const rangeStr = searchParams?.range ?? "30d";
  const days = rangeStr === "7d" ? 7 : rangeStr === "all" ? 365 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [eventsRes, suppressRes, leadsRes, usersRes] = await Promise.all([
    supabaseAdmin
      .from("email_events")
      .select("type, subject, email, occurred_at")
      .gte("occurred_at", since)
      .limit(20000),

    supabaseAdmin
      .from("email_suppressions")
      .select("email, reason, suppressed_at")
      .gte("suppressed_at", since)
      .order("suppressed_at", { ascending: false })
      .limit(50),

    // Pull leads with their nurture timestamps for disambiguation + funnel display.
    supabaseAdmin
      .from("leads")
      .select(
        "email, created_at, nurture_paused_at, " +
        "nurture_e2_sent_at, nurture_e3_sent_at, nurture_e4_sent_at, " +
        "nurture_e5_sent_at, nurture_e6_sent_at, nurture_e7_sent_at"
      )
      .gte("created_at", since)
      .limit(5000),

    // Pull ALL paid users (no date filter) so we can attribute paid users to
    // any email they received in the window. We need paid_at + cart_* timestamps.
    supabaseAdmin
      .from("users")
      .select("email, has_paid, paid_amount_cents, paid_at, created_at, " +
              "cart_email_1_sent_at, cart_email_2_sent_at")
      .eq("has_paid", true)
      .limit(5000),
  ]);

  const events = eventsRes.data ?? [];

  type PaidUser = {
    email: string;
    paid_at_ms: number | null;
    amount_cents: number;
    cart_e1_ms: number | null;
    cart_e2_ms: number | null;
  };

  // Build a lookup of paid users keyed by normalized email.
  // Internal/test accounts are excluded — they're noise, not signal.
  const paidByEmail = new Map<string, PaidUser>();
  type PaidUserRow = {
    email: string;
    has_paid: boolean;
    paid_amount_cents: number | null;
    paid_at: string | null;
    created_at: string | null;
    cart_email_1_sent_at: string | null;
    cart_email_2_sent_at: string | null;
  };
  for (const u of (usersRes.data ?? []) as unknown as PaidUserRow[]) {
    if (!u.has_paid || !u.email) continue;
    const lc = u.email.toLowerCase();
    if (isInternalEmail(lc)) continue;
    paidByEmail.set(lc, {
      email: lc,
      paid_at_ms: ms(u.paid_at) ?? ms(u.created_at),
      amount_cents: Number(u.paid_amount_cents ?? 8900),
      cart_e1_ms: ms(u.cart_email_1_sent_at),
      cart_e2_ms: ms(u.cart_email_2_sent_at),
    });
  }

  type LeadRow = {
    email: string;
    created_at: string;
    nurture_paused_at: string | null;
    nurture_e2_sent_at: string | null;
    nurture_e3_sent_at: string | null;
    nurture_e4_sent_at: string | null;
    nurture_e5_sent_at: string | null;
    nurture_e6_sent_at: string | null;
    nurture_e7_sent_at: string | null;
  };
  const leads = (leadsRes.data ?? []) as unknown as LeadRow[];

  // Per-recipient nurture-E3 send time (used to confirm p2t subjects are E3, not Cart E2).
  const nurtureE3TimeByEmail = new Map<string, number>();
  for (const l of leads) {
    if (!l.email || !l.nurture_e3_sent_at) continue;
    const t = ms(l.nurture_e3_sent_at);
    if (t != null) nurtureE3TimeByEmail.set(l.email.toLowerCase(), t);
  }

  // Disambiguate Cart E2 ↔ Nurture E3 using closest timestamp.
  function resolveRole(rawRole: EmailRole, recipient: string, occurredAtMs: number): EmailRole {
    if (rawRole !== "nurture_e3") return rawRole;
    const cartE2 = paidByEmail.get(recipient)?.cart_e2_ms;
    const nurtureE3 = nurtureE3TimeByEmail.get(recipient);
    const cartMatch = cartE2 != null && Math.abs(cartE2 - occurredAtMs) < MATCH_WINDOW_MS;
    const nurtureMatch = nurtureE3 != null && Math.abs(nurtureE3 - occurredAtMs) < MATCH_WINDOW_MS;
    if (cartMatch && !nurtureMatch) return "cart_e2";
    if (nurtureMatch) return "nurture_e3";
    // Neither timestamp matches (rare: orphan email). Keep as E3 — most p2t sends are E3.
    return "nurture_e3";
  }

  // Bucket sets per role per metric, deduped by email.
  const buckets: Record<EmailRole, Record<Bucket, Set<string>>> = {} as Record<EmailRole, Record<Bucket, Set<string>>>;
  for (const role of ROLE_ORDER) {
    buckets[role] = { sent: new Set(), delivered: new Set(), opened: new Set(), clicked: new Set(), bounced: new Set(), complained: new Set(), failed: new Set() };
  }

  // Earliest send time per (role, recipient) — required for causal attribution
  // (we attribute a paid user only if paid_at > earliest send time for that role).
  const firstSentByRole: Record<EmailRole, Map<string, number>> = {} as Record<EmailRole, Map<string, number>>;
  for (const role of ROLE_ORDER) firstSentByRole[role] = new Map();

  for (const ev of events) {
    const bucket = bucketFor(ev.type as string);
    if (!bucket) continue;
    const email = ((ev.email as string | null) ?? "").toLowerCase();
    if (!email) continue;
    if (isInternalEmail(email)) continue;

    const occurredAtMs = ms(ev.occurred_at as string) ?? 0;
    const rawRole = rawRoleForSubject((ev.subject as string | null) ?? null);
    const role = resolveRole(rawRole, email, occurredAtMs);

    buckets[role][bucket].add(email);

    if (bucket === "sent" && occurredAtMs > 0) {
      const prev = firstSentByRole[role].get(email);
      if (prev === undefined || occurredAtMs < prev) {
        firstSentByRole[role].set(email, occurredAtMs);
      }
    }
  }

  const metrics: RoleMetrics[] = ROLE_ORDER.map(role => {
    const b = buckets[role];
    const sent = b.sent.size;
    const delivered = b.delivered.size;
    const opened = b.opened.size;
    const clicked = b.clicked.size;
    const bounced = b.bounced.size;
    const complained = b.complained.size;
    const openRate = delivered > 0 ? opened / delivered : 0;
    const ctr = delivered > 0 ? clicked / delivered : 0;

    // Loose attribution (current behavior, kept for back-compat in the UI).
    let paid = 0;
    let revenueCents = 0;
    // Causal attribution: only if paid_at > earliest send time for this role.
    let paidAfter = 0;
    let revenueCentsAfter = 0;

    const firstSent = firstSentByRole[role];
    for (const recipient of b.sent) {
      const u = paidByEmail.get(recipient);
      if (!u) continue;
      paid++;
      revenueCents += u.amount_cents;

      const firstSentMs = firstSent.get(recipient);
      if (firstSentMs != null && u.paid_at_ms != null && u.paid_at_ms > firstSentMs) {
        paidAfter++;
        revenueCentsAfter += u.amount_cents;
      }
    }
    const conversionRate = sent > 0 ? paidAfter / sent : 0;

    return {
      role, label: ROLE_LABELS[role],
      sent, delivered, opened, clicked, bounced, complained,
      openRate, ctr,
      paid, conversionRate, revenueCents,
      paidAfter, revenueCentsAfter,
    };
  });

  const suppressions = (suppressRes.data ?? []).map(s => ({
    email: s.email as string,
    reason: s.reason as string,
    when: (s.suppressed_at as string).slice(0, 10),
  }));

  // Lead nurture funnel stats (excludes internals).
  const leadsExt = leads.filter(l => l.email && !isInternalEmail(l.email.toLowerCase()));
  const leadsTotal = leadsExt.length;
  const leadsPaused = leadsExt.filter(l => l.nurture_paused_at != null).length;
  const leadStepCounts = {
    e2: leadsExt.filter(l => l.nurture_e2_sent_at != null).length,
    e3: leadsExt.filter(l => l.nurture_e3_sent_at != null).length,
    e4: leadsExt.filter(l => l.nurture_e4_sent_at != null).length,
    e5: leadsExt.filter(l => l.nurture_e5_sent_at != null).length,
    e6: leadsExt.filter(l => l.nurture_e6_sent_at != null).length,
    e7: leadsExt.filter(l => l.nurture_e7_sent_at != null).length,
  };

  // Top-level sales — excludes internals so it matches Stripe's `revenue` view.
  const totalPaid = paidByEmail.size;
  const totalRevenueCents = Array.from(paidByEmail.values()).reduce((s, u) => s + u.amount_cents, 0);

  // Unique-paid metrics across all roles (each buyer counted once).
  const uniquePaidEmails = new Set<string>();
  const uniquePaidAfterEmails = new Set<string>();
  for (const role of ROLE_ORDER) {
    const firstSent = firstSentByRole[role];
    for (const recipient of buckets[role].sent) {
      const u = paidByEmail.get(recipient);
      if (!u) continue;
      uniquePaidEmails.add(recipient);
      const firstSentMs = firstSent.get(recipient);
      if (firstSentMs != null && u.paid_at_ms != null && u.paid_at_ms > firstSentMs) {
        uniquePaidAfterEmails.add(recipient);
      }
    }
  }
  const uniquePaidCount = uniquePaidEmails.size;
  const uniqueRevenueCents = Array.from(uniquePaidEmails)
    .map(e => paidByEmail.get(e)?.amount_cents ?? 0)
    .reduce((s, n) => s + n, 0);
  const uniquePaidAfterCount = uniquePaidAfterEmails.size;
  const uniqueRevenueAfterCents = Array.from(uniquePaidAfterEmails)
    .map(e => paidByEmail.get(e)?.amount_cents ?? 0)
    .reduce((s, n) => s + n, 0);

  return (
    <EmailsClient
      range={rangeStr}
      metrics={metrics}
      suppressions={suppressions}
      leads={{
        total: leadsTotal,
        paused: leadsPaused,
        stepCounts: leadStepCounts,
      }}
      sales={{
        paidCount: totalPaid,
        revenueCents: totalRevenueCents,
        uniquePaidCount,
        uniqueRevenueCents,
        uniquePaidAfterCount,
        uniqueRevenueAfterCents,
      }}
    />
  );
}

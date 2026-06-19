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

function roleFor(subject: string | null): EmailRole {
  const s = (subject ?? "").toLowerCase();
  if (s.includes("preliminary report"))                                          return "report";
  if (s.includes("body analysis is waiting"))                                    return "cart_e1";
  if (s.includes("still thinking") || s.includes("preliminary report couldn't")) return "cart_e2";
  if (s.includes("last email"))                                                  return "nurture_e7";
  if (s.includes("your projection"))                                             return "nurture_e6";
  if (s.includes("executive presence") || s.includes("signaling in rooms") ||
      s.includes("composed-not-muscular") || s.includes("term-by-term") ||
      s.includes("you know the literature") || s.includes("looking strong"))      return "nurture_e5";
  if (s.includes("12 weeks later"))                                              return "nurture_e4";
  // E3 uses pattern p2t as subject — hard to detect generically, so fall through
  if (s.includes("trainer wasn't aimed") || s.includes("youtube failed") ||
      s.includes("diets shrink") || s.includes("zero-baseline") ||
      s.includes("one variable isn't") || s.includes("what you've tried"))        return "nurture_e2";
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
  // Attribution: recipients who eventually paid (regardless of when).
  // Correlation, not strict causal attribution — a paying user may have received multiple emails.
  paid: number;
  conversionRate: number;
  revenueCents: number;
};

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

    supabaseAdmin
      .from("leads")
      .select(
        "email, created_at, nurture_paused_at, " +
        "nurture_e2_sent_at, nurture_e3_sent_at, nurture_e4_sent_at, " +
        "nurture_e5_sent_at, nurture_e6_sent_at, nurture_e7_sent_at"
      )
      .gte("created_at", since)
      .limit(5000),

    // Pull ALL paying users (no date filter) so we attribute paid users to
    // any email they received in the window. Volume is small (~5/week).
    supabaseAdmin
      .from("users")
      .select("email, has_paid, paid_amount_cents, created_at")
      .eq("has_paid", true)
      .limit(5000),
  ]);

  const events = eventsRes.data ?? [];

  const buckets: Record<EmailRole, Record<Bucket, Set<string>>> = {} as Record<EmailRole, Record<Bucket, Set<string>>>;
  for (const role of ROLE_ORDER) {
    buckets[role] = { sent: new Set(), delivered: new Set(), opened: new Set(), clicked: new Set(), bounced: new Set(), complained: new Set(), failed: new Set() };
  }

  for (const ev of events) {
    const bucket = bucketFor(ev.type as string);
    if (!bucket) continue;
    const role = roleFor((ev.subject as string | null) ?? null);
    const email = (ev.email as string | null) ?? "";
    // Use email as dedup key — one open per recipient counts once.
    if (!email) continue;
    buckets[role][bucket].add(email);
  }

  // Build a lookup of paid users keyed by normalized email → amount paid.
  const paidUsersList = (usersRes.data ?? []) as Array<{ email: string; has_paid: boolean; paid_amount_cents: number | null }>;
  const paidByEmail = new Map<string, number>();
  for (const u of paidUsersList) {
    if (!u.has_paid || !u.email) continue;
    paidByEmail.set(u.email.toLowerCase(), Number(u.paid_amount_cents ?? 8900));
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

    // Attribution: among recipients of this role (deduped by email), how many ended up paying.
    let paid = 0;
    let revenueCents = 0;
    for (const recipient of b.sent) {
      const amount = paidByEmail.get(recipient.toLowerCase());
      if (amount != null) {
        paid++;
        revenueCents += amount;
      }
    }
    const conversionRate = sent > 0 ? paid / sent : 0;

    return {
      role, label: ROLE_LABELS[role],
      sent, delivered, opened, clicked, bounced, complained,
      openRate, ctr,
      paid, conversionRate, revenueCents,
    };
  });

  const suppressions = (suppressRes.data ?? []).map(s => ({
    email: s.email as string,
    reason: s.reason as string,
    when: (s.suppressed_at as string).slice(0, 10),
  }));

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
  const leadsTotal = leads.length;
  const leadsPaused = leads.filter(l => l.nurture_paused_at != null).length;
  const leadStepCounts = {
    e2: leads.filter(l => l.nurture_e2_sent_at != null).length,
    e3: leads.filter(l => l.nurture_e3_sent_at != null).length,
    e4: leads.filter(l => l.nurture_e4_sent_at != null).length,
    e5: leads.filter(l => l.nurture_e5_sent_at != null).length,
    e6: leads.filter(l => l.nurture_e6_sent_at != null).length,
    e7: leads.filter(l => l.nurture_e7_sent_at != null).length,
  };

  const totalPaid = paidByEmail.size;
  const totalRevenueCents = Array.from(paidByEmail.values()).reduce((s, n) => s + n, 0);

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
      }}
    />
  );
}

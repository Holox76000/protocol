import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import FunnelClient from "./FunnelClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  await requireAdmin();

  const SINCE = "2026-06-12T03:15:00Z"; // Report funnel deployed

  // ── 1. Quiz sessions — step progression via _max_step ────────────────
  const { data: sessions } = await supabaseAdmin
    .from("funnel_sessions")
    .select("session_id, answers, created_at")
    .gte("created_at", SINCE)
    .not("answers->_session_id", "is", null)
    .order("created_at", { ascending: true });

  // ── 2. Leads — optin email captured ──────────────────────────────────
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("email, payload, created_at")
    .gte("created_at", SINCE)
    .order("created_at", { ascending: true });

  // ── 3. Funnel events — report_viewed, report_cta_clicked, view_offer ─
  const { data: events } = await supabaseAdmin
    .from("event_sessions")
    .select("session_id, event, payload, created_at")
    .gte("created_at", SINCE)
    .in("event", ["report_viewed", "report_cta_clicked", "view_offer", "funnel_step"])
    .order("created_at", { ascending: true });

  // ── 4. Purchases — cross-ref leads by email ───────────────────────────
  const leadEmails = new Set((leads ?? []).map(l => l.email.toLowerCase()));
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("email, first_name, created_at")
    .eq("has_paid", true)
    .gte("created_at", SINCE)
    .order("created_at", { ascending: true });

  // ── Build funnel_sid sets for each step ───────────────────────────────

  // Quiz steps: use _max_step thresholds (slide indices from funnel-config)
  // 0=intro, 7=goals(Q6), 9=height(Q7), 10=weight(Q8), 14=past_solutions(Q11)
  // 18=yes-ladder1, 22=optin slide
  const allSessions = (sessions ?? []).map(s => ({
    sid: s.session_id as string,
    maxStep: Number((s.answers as Record<string, unknown>)._max_step ?? -1),
    date: (s.created_at as string).slice(0, 10),
  })).filter(s => s.maxStep >= 0);

  const quizSteps = [
    { key: "quiz_started",      label: "Quiz démarré",           threshold: 0  },
    { key: "quiz_goals",        label: "Objectifs (Q6)",         threshold: 7  },
    { key: "quiz_biometrics",   label: "Biométriques (Q8)",      threshold: 10 },
    { key: "quiz_past",         label: "Solutions passées (Q11)", threshold: 14 },
    { key: "quiz_yes_ladders",  label: "Yes-ladders",            threshold: 18 },
  ];

  const quizCounts: Record<string, Set<string>> = {};
  for (const step of quizSteps) {
    quizCounts[step.key] = new Set(
      allSessions.filter(s => s.maxStep >= step.threshold).map(s => s.sid)
    );
  }

  // Optin: leads with funnel_sid
  const optinSids = new Set(
    (leads ?? [])
      .filter(l => (l.payload as Record<string, unknown>)?.funnel_sid)
      .map(l => String((l.payload as Record<string, unknown>).funnel_sid))
  );

  // Downstream events — keyed by session_id (= funnel_sid for these events)
  const reportViewedSids   = new Set<string>();
  const reportCtaSids      = new Set<string>();
  const offerViewedSids    = new Set<string>();

  for (const e of events ?? []) {
    const sid = e.session_id as string;
    const payload = (e.payload ?? {}) as Record<string, unknown>;
    if (e.event === "report_viewed")     reportViewedSids.add(sid);
    if (e.event === "report_cta_clicked") reportCtaSids.add(sid);
    if (e.event === "view_offer" && payload.funnel_sid) offerViewedSids.add(String(payload.funnel_sid));
  }

  // Purchases: match by email cross-ref
  const purchasedEmails = new Set(
    (users ?? []).filter(u => leadEmails.has(u.email.toLowerCase())).map(u => u.email.toLowerCase())
  );
  const purchaseCount = purchasedEmails.size;

  // ── Build funnel rows ─────────────────────────────────────────────────
  const funnelRows = [
    { key: "quiz_started",        label: "Quiz démarré",           n: quizCounts.quiz_started?.size  ?? 0, source: "funnel_sessions",    reliable: true  },
    { key: "quiz_goals",          label: "Q6 — Objectifs",         n: quizCounts.quiz_goals?.size    ?? 0, source: "funnel_sessions",    reliable: true  },
    { key: "quiz_biometrics",     label: "Q8 — Biométriques",      n: quizCounts.quiz_biometrics?.size ?? 0, source: "funnel_sessions", reliable: true  },
    { key: "quiz_past",           label: "Q11 — Solutions passées", n: quizCounts.quiz_past?.size     ?? 0, source: "funnel_sessions",   reliable: true  },
    { key: "quiz_yes_ladders",    label: "Yes-ladders",            n: quizCounts.quiz_yes_ladders?.size ?? 0, source: "funnel_sessions", reliable: true  },
    { key: "optin",               label: "Optin email",            n: optinSids.size,                       source: "leads",            reliable: true  },
    { key: "report_viewed",       label: "Rapport vu",             n: reportViewedSids.size,                source: "event_sessions",   reliable: true  },
    { key: "report_cta_clicked",  label: "CTA rapport cliqué",     n: reportCtaSids.size,                   source: "event_sessions",   reliable: true  },
    { key: "offer_viewed",        label: "Offer page vue",         n: offerViewedSids.size,                 source: "event_sessions",   reliable: true  },
    { key: "purchased",           label: "Achat",                  n: purchaseCount,                        source: "users",            reliable: true  },
  ];

  // Recent conversions detail
  const conversions = (users ?? [])
    .filter(u => leadEmails.has(u.email.toLowerCase()))
    .map(u => ({ email: u.email, name: u.first_name ?? "—", date: (u.created_at as string).slice(0, 10) }));

  return (
    <FunnelClient
      rows={funnelRows}
      conversions={conversions}
      since={SINCE.slice(0, 10)}
      totalSessions={allSessions.length}
    />
  );
}

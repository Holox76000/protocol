import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";

export const runtime = "nodejs";

export const metadata = { title: "NPS Dashboard | Admin" };

function npsColor(score: number) {
  if (score >= 70) return "#4a7a5e";
  if (score >= 50) return "#3a6050";
  if (score >= 0)  return "#7a6a2e";
  return "#8b3a3a";
}

function npsLabel(score: number) {
  if (score >= 70) return "Exceptional";
  if (score >= 50) return "Good";
  if (score >= 0)  return "Needs work";
  return "Critical";
}

type Row = {
  id: string;
  email: string;
  first_name: string | null;
  nps_score: number | null;
  nps_category: string | null;
  nps_submitted_at: string | null;
  nps_answers: Array<{ question: string; answer: string }> | null;
  nps_testimonial: string | null;
  nps_sent_at: string | null;
  nps_30d_score: number | null;
  nps_30d_submitted_at: string | null;
  nps_30d_answers: Array<{ question: string; answer: string }> | null;
};

function computeNps(rows: Row[], scoreKey: "nps_score" | "nps_30d_score") {
  const scored = rows.filter(r => r[scoreKey] != null);
  if (scored.length === 0) return { nps: null, promoters: 0, passives: 0, detractors: 0, total: 0 };

  const promoters  = scored.filter(r => (r[scoreKey] ?? 0) >= 9).length;
  const detractors = scored.filter(r => (r[scoreKey] ?? 0) <= 6).length;
  const passives   = scored.length - promoters - detractors;
  const nps = Math.round((promoters / scored.length) * 100) - Math.round((detractors / scored.length) * 100);

  return { nps, promoters, passives, detractors, total: scored.length };
}

export default async function AdminNpsPage() {
  await requireAdmin();

  const { data: allPaid } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, nps_score, nps_category, nps_submitted_at, nps_answers, nps_testimonial, nps_sent_at, nps_30d_score, nps_30d_submitted_at, nps_30d_answers")
    .eq("has_paid", true)
    .order("nps_submitted_at", { ascending: false });

  const rows = (allPaid ?? []) as Row[];
  const emailsSent = rows.filter(r => r.nps_sent_at != null).length;
  const initial = computeNps(rows, "nps_score");
  const thirtyDay = computeNps(rows, "nps_30d_score");

  const recent = rows.filter(r => r.nps_submitted_at != null).slice(0, 15);

  const pct = (n: number, total: number) =>
    total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#7f949b", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Admin · NPS
      </p>
      <h1 style={{ margin: "0 0 40px", fontSize: 28, fontWeight: 400, color: "#253239" }}>
        NPS Dashboard
      </h1>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
        {/* Initial NPS */}
        <div style={{ background: "#ffffff", border: "1px solid #edf0f1", borderRadius: 12, padding: "28px 24px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#7f949b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Initial NPS · T+30min
          </p>
          {initial.nps !== null ? (
            <>
              <p style={{ margin: "8px 0 2px", fontSize: 52, fontWeight: 700, color: npsColor(initial.nps), lineHeight: 1 }}>
                {initial.nps > 0 ? "+" : ""}{initial.nps}
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: npsColor(initial.nps), fontWeight: 600 }}>
                {npsLabel(initial.nps)}
              </p>
            </>
          ) : (
            <p style={{ margin: "8px 0 16px", fontSize: 28, color: "#dfe4e6", fontWeight: 700 }}>—</p>
          )}
          <div style={{ display: "flex", gap: 16 }}>
            <Stat label="Promoters" value={initial.promoters} pct={pct(initial.promoters, initial.total)} color="#4a7a5e" />
            <Stat label="Passives"  value={initial.passives}  pct={pct(initial.passives,  initial.total)} color="#7a6a2e" />
            <Stat label="Detractors" value={initial.detractors} pct={pct(initial.detractors, initial.total)} color="#8b3a3a" />
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#7f949b" }}>
            {initial.total} responses · {emailsSent} emails sent
            {emailsSent > 0 && ` · ${Math.round((initial.total / emailsSent) * 100)}% response rate`}
          </p>
        </div>

        {/* 30-day NPS */}
        <div style={{ background: "#ffffff", border: "1px solid #edf0f1", borderRadius: 12, padding: "28px 24px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#7f949b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            30-Day NPS
          </p>
          {thirtyDay.nps !== null ? (
            <>
              <p style={{ margin: "8px 0 2px", fontSize: 52, fontWeight: 700, color: npsColor(thirtyDay.nps), lineHeight: 1 }}>
                {thirtyDay.nps > 0 ? "+" : ""}{thirtyDay.nps}
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: npsColor(thirtyDay.nps), fontWeight: 600 }}>
                {npsLabel(thirtyDay.nps)}
              </p>
            </>
          ) : (
            <p style={{ margin: "8px 0 16px", fontSize: 28, color: "#dfe4e6", fontWeight: 700 }}>—</p>
          )}
          <div style={{ display: "flex", gap: 16 }}>
            <Stat label="Promoters" value={thirtyDay.promoters} pct={pct(thirtyDay.promoters, thirtyDay.total)} color="#4a7a5e" />
            <Stat label="Passives"  value={thirtyDay.passives}  pct={pct(thirtyDay.passives,  thirtyDay.total)} color="#7a6a2e" />
            <Stat label="Detractors" value={thirtyDay.detractors} pct={pct(thirtyDay.detractors, thirtyDay.total)} color="#8b3a3a" />
          </div>
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#7f949b" }}>
            {thirtyDay.total} responses
          </p>
        </div>
      </div>

      {/* Thresholds legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 40, flexWrap: "wrap" }}>
        {[
          { label: "< 0 — Critical", color: "#8b3a3a" },
          { label: "0-49 — Needs work", color: "#7a6a2e" },
          { label: "50-69 — Good", color: "#3a6050" },
          { label: "70+ — Exceptional", color: "#4a7a5e" },
        ].map(t => (
          <span key={t.label} style={{ fontSize: 12, color: t.color, fontWeight: 500 }}>● {t.label}</span>
        ))}
      </div>

      {/* Recent responses */}
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#253239" }}>
        Recent responses
      </h2>

      {recent.length === 0 ? (
        <p style={{ fontSize: 14, color: "#7f949b" }}>No responses yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recent.map(r => {
            const cat = r.nps_category ?? (r.nps_score != null ? (r.nps_score >= 9 ? "promoter" : r.nps_score >= 7 ? "passive" : "detractor") : null);
            const catColor = cat === "promoter" ? "#4a7a5e" : cat === "passive" ? "#7a6a2e" : "#8b3a3a";
            const date = r.nps_submitted_at
              ? new Date(r.nps_submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";

            return (
              <div key={r.id} style={{ background: "#ffffff", border: "1px solid #edf0f1", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: r.nps_answers?.length || r.nps_testimonial ? 12 : 0, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#253239" }}>
                    {r.first_name ?? r.email}
                  </span>
                  <span style={{ fontSize: 12, color: "#7f949b" }}>{r.email}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: catColor, marginLeft: "auto" }}>
                    {r.nps_score}/10
                  </span>
                  {cat && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: catColor, background: `${catColor}18`, padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>
                      {cat}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "#7f949b" }}>{date}</span>
                </div>

                {r.nps_testimonial && (
                  <p style={{ margin: "0 0 8px", fontSize: 14, color: "#253239", lineHeight: 1.6, fontStyle: "italic" }}>
                    "{r.nps_testimonial}"
                  </p>
                )}

                {(r.nps_answers ?? []).map((a, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color: "#7f949b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{a.question}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#515255", lineHeight: 1.6 }}>{a.answer}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, pct, color }: { label: string; value: number; pct: string; color: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color }}>{value}</p>
      <p style={{ margin: "1px 0 0", fontSize: 11, color: "#7f949b" }}>{label} · {pct}</p>
    </div>
  );
}

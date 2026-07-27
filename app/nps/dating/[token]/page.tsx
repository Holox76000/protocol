import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "../../../../lib/supabase";
import { loadActiveTemplates } from "../../../../lib/datingTemplates";
import NpsDatingForm from "./NpsDatingForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NpsDatingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ score?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const rawScore = parseInt(sp.score ?? "", 10);
  const initialScore = rawScore >= 1 && rawScore <= 10 ? rawScore : null;

  const { data: order } = await supabaseAdmin
    .from("dating_orders")
    .select("id, first_name, nps_submitted_at, output_paths")
    .eq("nps_token", token)
    .maybeSingle<{ id: string; first_name: string | null; nps_submitted_at: string | null; output_paths: string[] | null }>();

  if (!order) notFound();
  if (order.nps_submitted_at) redirect("/nps/thanks?category=dating");

  const templates = await loadActiveTemplates();
  // Only offer templates that were actually delivered — infer from the
  // filename prefix ("nature-*.jpg", "lifestyle-*.jpg", …).
  const deliveredSlugs = new Set(
    (order.output_paths ?? []).map((p) => (p.split("/").pop() ?? "").split("-")[0]),
  );
  const templateOptions = templates
    .filter((t) => deliveredSlugs.has(t.slug))
    .map((t) => ({ slug: t.slug, label: t.label }));

  return (
    <main style={{ minHeight: "100vh", background: "#f9fbfb" }}>
      <NpsDatingForm
        token={token}
        firstName={order.first_name}
        initialScore={initialScore ?? 8}
        templateOptions={templateOptions}
      />
    </main>
  );
}

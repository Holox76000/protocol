// Dynamic face-swap templates for Protocol Dating. Backed by the
// dating_templates table + the ref image stored in the dating-photos
// bucket under templates/. Admin CRUDs via /admin/dating/templates.
//
// The worker (cron/dating-generate) calls loadActiveTemplates() then for
// each returned template downloads ref_image_path via supabaseAdmin.storage.

import { supabaseAdmin } from "./supabase";

export type DatingTemplate = {
  id: string;
  slug: string;
  label: string;
  prompt: string;         // body only — buildPrompt() adds identity + hygiene clauses
  refImagePath: string;   // path inside the dating-photos bucket
  active: boolean;
  sortOrder: number;
  kind: "core" | "luxury"; // luxury = unlocked only by the $20 upsell
  createdAt: string;
  updatedAt: string;
};

export type TemplateKind = "core" | "luxury";

// Minimal wrapper. Keep it SHORT — long text prompts confuse the image model
// and get overweighted vs the visual references. The core instruction is
// "copy the face from the selfies, keep the scene" — everything else is noise.
const IDENTITY_PREAMBLE =
  "Take the face from the selfie photos and apply it to the man in the reference image. " +
  "Copy his exact face at photographic fidelity — same shape, same features, same skin tone. " +
  "The selfies are the ground truth. Do not idealize.";

const OUTPUT_HYGIENE =
  "Remove any UI overlay (chat bubbles, Reply buttons, status bars, timestamps) — output a clean photograph only. " +
  "No watermark, no logo, no text. Only the person's identity changes; do not alter anything else in the scene.";

// Callers pass just the scene-specific body; the identity + hygiene clauses
// are wrapped here so all templates stay consistent. Kept as a pure fn so
// the admin form and the worker both go through the same rendering path.
export function buildPrompt(bodyPrompt: string): string {
  return [IDENTITY_PREAMBLE, bodyPrompt, OUTPUT_HYGIENE].join("\n\n");
}

// Turn admin-typed labels into slugs (kebab-case, lowercase, ASCII-only).
// The DB has a CHECK constraint enforcing the same shape — this is just the
// UX side that autopopulates the field on typing.
export function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")     // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// DB row shape → typed template
type Row = {
  id: string;
  slug: string;
  label: string;
  prompt: string;
  ref_image_path: string;
  active: boolean;
  sort_order: number;
  kind: TemplateKind | null;
  created_at: string;
  updated_at: string;
};

function rowToTemplate(row: Row): DatingTemplate {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    prompt: row.prompt,
    refImagePath: row.ref_image_path,
    active: row.active,
    sortOrder: row.sort_order,
    kind: (row.kind ?? "core") as TemplateKind,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS =
  "id, slug, label, prompt, ref_image_path, active, sort_order, kind, created_at, updated_at";

// Worker path. Returns templates in the order the customer will receive
// their photos. Filter is DB-side so an inactive template never even makes
// it into the fan-out.
//
// `kinds` restricts to a subset — defaults to core only. The luxury set is
// gated behind the $20 upsell and should never leak into a standard order.
export async function loadActiveTemplates(
  kinds: TemplateKind[] = ["core"],
): Promise<DatingTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from("dating_templates")
    .select(SELECT_COLUMNS)
    .eq("active", true)
    .in("kind", kinds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[datingTemplates] loadActiveTemplates failed", { error: error.message });
    return [];
  }
  return (data ?? []).map((r) => rowToTemplate(r as Row));
}

// Admin path — includes inactive templates so the admin can reorder / toggle.
export async function loadAllTemplates(): Promise<DatingTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from("dating_templates")
    .select(SELECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[datingTemplates] loadAllTemplates failed", { error: error.message });
    return [];
  }
  return (data ?? []).map((r) => rowToTemplate(r as Row));
}

export async function getTemplateById(id: string): Promise<DatingTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from("dating_templates")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[datingTemplates] getTemplateById failed", { error: error.message, id });
    return null;
  }
  return data ? rowToTemplate(data as Row) : null;
}

export async function getTemplateBySlug(slug: string): Promise<DatingTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from("dating_templates")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[datingTemplates] getTemplateBySlug failed", { error: error.message, slug });
    return null;
  }
  return data ? rowToTemplate(data as Row) : null;
}

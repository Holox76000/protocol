import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import OfferImagesReviewClient from "./OfferImagesReviewClient";

export const runtime = "nodejs";
export const metadata = { title: "Offer Images Review | Admin" };

const MORPHOLOGIES = ["Skinny", "Skinny-fat", "Overweight", "Average"];
const ETHNICITIES = ["Caucasian", "Black", "Asian (East / SE)", "South Asian", "Hispanic-Latino", "MENA"];
const AGE_BRACKETS = ["20-29", "30-39", "40-49", "50+"];
const CACHED_FILES = [
  "result-1-before.png", "result-1-after.png",
  "result-2-before.png", "result-2-after.png",
  "result-3-before.png", "result-3-after.png",
  "portrait.png",
];
const BUCKET = "offer-images";

function sanitizeCacheKey(morphology: string, ethnicity: string, ageBracket: string) {
  return `${morphology}_${ethnicity}_${ageBracket}`
    .replace(/\+/g, "plus")
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

export type ComboStatus = {
  morphology: string;
  ethnicity: string;
  ageBracket: string;
  cacheKey: string;
  existingFiles: string[];
  status: "done" | "partial" | "missing";
};

export default async function OfferImagesPage() {
  await requireAdmin();

  // Load all combo statuses in parallel (96 list calls)
  const allCombos = MORPHOLOGIES.flatMap((m) =>
    ETHNICITIES.flatMap((e) =>
      AGE_BRACKETS.map((a) => ({ m, e, a, key: sanitizeCacheKey(m, e, a) }))
    )
  );

  const results = await Promise.all(
    allCombos.map(async ({ m, e, a, key }) => {
      const { data } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(key);
      const existing = (data ?? []).map((f) => f.name).filter((n) => CACHED_FILES.includes(n));
      const status =
        existing.length === CACHED_FILES.length ? "done" :
        existing.length > 0 ? "partial" : "missing";
      return { morphology: m, ethnicity: e, ageBracket: a, cacheKey: key, existingFiles: existing, status } satisfies ComboStatus;
    })
  );

  // Load existing feedback
  const feedbackJson = await supabaseAdmin.storage
    .from(BUCKET)
    .download(`_feedback.json`)
    .then(async ({ data }) => {
      if (!data) return "{}";
      return data.text();
    })
    .catch(() => "{}");

  const initialFeedback = JSON.parse(feedbackJson) as Record<string, unknown>;

  const doneCount = results.filter((c) => c.status === "done").length;

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Admin</p>
            <h1 className="mt-1 font-display text-3xl text-void">Offer Images</h1>
            <p className="mt-1 text-[13px] text-dim">
              {doneCount}/96 générées · cliquer sur une combo pour voir les images et laisser un feedback
            </p>
          </div>
          <a href="/admin" className="mt-2 text-[12px] font-semibold text-mute hover:text-void transition-colors">
            ← Admin
          </a>
        </div>
        <OfferImagesReviewClient combos={results} initialFeedback={initialFeedback} />
      </div>
    </main>
  );
}

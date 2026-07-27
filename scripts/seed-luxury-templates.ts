// Seed the 8 luxury templates used by the "Luxury Lifestyle" $20 upsell.
// Each template inserts inactive-by-default: an admin must upload the ref
// image via /admin/dating/templates and toggle active=true before the
// pipeline can use them. This is intentional — generating without a
// reference image just crashes the run.
//
// Run once:
//   npx tsx scripts/seed-luxury-templates.ts
//
// Idempotent by slug: re-running updates the prompt and label but never
// touches active/ref_image_path (so admin edits are preserved).

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type Seed = { slug: string; label: string; prompt: string; sortOrder: number };

const LUXURY_TEMPLATES: Seed[] = [
  {
    slug: "luxury-yacht-mediterranean",
    label: "Luxury yacht",
    sortOrder: 100,
    prompt:
      "Golden-hour deck of a large white superyacht anchored off a Mediterranean coastline (Amalfi / Côte d'Azur vibe). " +
      "Subject stands mid-frame, one hand relaxed on the polished chrome railing, gazing off toward the horizon in a calm, unposed way — the eye direction and expression must match the reference selfies exactly. " +
      "Wear: crisp white linen shirt half-unbuttoned, warm-tan chinos, no logo. Wristwatch on the visible wrist. " +
      "Rim-lit late-afternoon sun, teak deck underfoot, out-of-focus turquoise water and coastal cliffs behind. " +
      "Editorial luxury lifestyle photograph — Kodak Portra film feel, subtle grain, no HDR, no plastic skin. Body proportions and skin tone must strictly match the selfies.",
  },
  {
    slug: "luxury-private-jet-cabin",
    label: "Private jet",
    sortOrder: 101,
    prompt:
      "Interior of a private business jet cabin, cream leather club seat, walnut trim. " +
      "Subject seated slightly angled toward camera, one arm along the armrest, half-smile that matches the reference selfies' natural expression. " +
      "Wear: charcoal cashmere sweater over a white tee, no logo. " +
      "Soft cabin lighting from a side window (out-of-focus cloud layer through the porthole), champagne flute or coffee cup on the side table, subtle bokeh. " +
      "Editorial lifestyle photograph — quiet money aesthetic, no gaudy branding. Skin tone and facial structure strictly per the selfies.",
  },
  {
    slug: "luxury-infinity-pool-rooftop",
    label: "Rooftop infinity pool",
    sortOrder: 102,
    prompt:
      "Rooftop infinity pool overlooking a warm-weather city skyline (Dubai / Marrakech / Bangkok vibe) at golden hour. " +
      "Subject in the pool at the edge, arms resting on the coping, half torso above water, looking off-camera with a calm expression that matches the reference selfies. " +
      "No swim goggles, no cap. Wet hair only if the reference selfies show short hair — otherwise dry hair pushed back. " +
      "Warm rim light, city bokeh behind, palm silhouettes optional. " +
      "Editorial luxury travel photograph. Do not idealize body proportions — keep them consistent with the selfies.",
  },
  {
    slug: "luxury-ski-chalet-alps",
    label: "Alpine ski chalet",
    sortOrder: 103,
    prompt:
      "Snow-covered wooden balcony of an Alpine luxury chalet (St. Moritz / Verbier vibe), late afternoon soft light. " +
      "Subject leans forearms on the balcony rail, gaze off toward the mountains, expression relaxed and identical to the reference selfies. " +
      "Wear: chunky cream cable-knit sweater, no logo. Faint breath vapor in cold air. " +
      "Out-of-focus snow-dusted pine forest and distant peaks in the background, warm interior light spilling from a window behind. " +
      "Editorial ski-town lifestyle photograph — natural skin tone, no over-saturation.",
  },
  {
    slug: "luxury-f1-paddock",
    label: "F1 paddock",
    sortOrder: 104,
    prompt:
      "Formula 1 race weekend paddock, golden late-afternoon light, out-of-focus garage bays and team hospitality area behind. " +
      "Subject stands in three-quarter angle to camera, sunglasses pushed up onto forehead (eyes fully visible, expression matching the reference selfies exactly). " +
      "Wear: unbranded dark polo, dark chinos, VIP paddock lanyard visible around the neck (no readable text on the lanyard). " +
      "Shallow depth of field, warm rim light, subtle motion blur from a passing crew member. " +
      "Editorial lifestyle photograph. No visible team or sponsor logos. Do not alter facial structure or skin tone.",
  },
  {
    slug: "luxury-michelin-restaurant",
    label: "Michelin dining",
    sortOrder: 105,
    prompt:
      "Interior of a fine-dining restaurant, dim warm terracotta lighting, dark leather banquette, single candle glow on the linen table. " +
      "Subject seated at a table, slight lean forward, one hand around the base of a wine glass, expression warm and matched to the reference selfies. " +
      "Wear: navy blazer over an open-collar white shirt, no tie, no logo. " +
      "Out-of-focus tasting menu plating in mid-frame, background diners rendered as amber bokeh. " +
      "Editorial food-and-travel photograph — Kodak Portra film feel. Preserve exact skin tone and facial features from the selfies.",
  },
  {
    slug: "luxury-polo-club",
    label: "Polo club",
    sortOrder: 106,
    prompt:
      "Sunlit polo field sideline (Argentine / Hamptons vibe), late-afternoon golden light, out-of-focus horses and players in the background. " +
      "Subject stands in three-quarter angle, one hand relaxed in a pocket, gazing off toward the field, expression matching the reference selfies. " +
      "Wear: crisp white unbranded polo shirt, sand-colored linen trousers, brown leather belt just visible. " +
      "Rim-lit natural sun, subtle heat haze in the far background, well-manicured lawn. " +
      "Editorial lifestyle photograph. No visible sponsor or team logos. Body and skin per the selfies.",
  },
  {
    slug: "luxury-supercar-night",
    label: "Supercar at night",
    sortOrder: 107,
    prompt:
      "Subject leans against the rear quarter panel of a matte-dark high-end sports coupe (Aston Martin / Ferrari silhouette, no visible badge) in an underground parking garage at night. " +
      "Cool overhead sodium lighting mixed with warm accent lights reflecting off the car's paint. Arms crossed relaxed, half-smile matching the reference selfies. " +
      "Wear: black leather jacket over a plain grey tee, dark jeans, no logo. " +
      "Cinematic contrast, shallow depth of field, the car's polished paint reflecting soft rim light. " +
      "Editorial automotive lifestyle photograph. Preserve exact facial structure and skin tone from the selfies — no idealization.",
  },
];

async function main() {
  console.log(`Seeding ${LUXURY_TEMPLATES.length} luxury templates…`);
  for (const t of LUXURY_TEMPLATES) {
    const { data: existing } = await sb
      .from("dating_templates")
      .select("id")
      .eq("slug", t.slug)
      .maybeSingle();

    if (existing) {
      // Update prompt + label + kind + sort_order, but preserve active flag
      // and ref_image_path — admin owns those.
      const { error } = await sb
        .from("dating_templates")
        .update({
          label: t.label,
          prompt: t.prompt,
          sort_order: t.sortOrder,
          kind: "luxury",
        })
        .eq("id", existing.id);
      console.log(`  ↻ ${t.slug} ${error ? `FAILED: ${error.message}` : "updated"}`);
    } else {
      // Insert inactive so it doesn't fire in generation until the admin
      // uploads the ref image + toggles active.
      const { error } = await sb.from("dating_templates").insert({
        slug: t.slug,
        label: t.label,
        prompt: t.prompt,
        sort_order: t.sortOrder,
        kind: "luxury",
        active: false,
        // Placeholder — admin MUST replace this via /admin/dating/templates.
        ref_image_path: "templates/_placeholder.jpg",
      });
      console.log(`  ＋ ${t.slug} ${error ? `FAILED: ${error.message}` : "inserted (inactive — upload ref image & toggle active)"}`);
    }
  }
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });

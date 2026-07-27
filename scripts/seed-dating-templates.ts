// One-off seed: uploads 5 pre-converted WebP references to Supabase Storage
// and inserts the matching dating_templates rows. Idempotent: skips a row if
// the slug already exists in DB, but re-uploads the storage file (upsert:true)
// so re-running after fixing a bad crop is safe.

import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const BUCKET = "dating-photos";
const LOCAL_DIR = "/tmp/dating-templates";

// Prompt bodies follow the same pattern as the initial snorkel seed —
// "Replace the man in the reference image with..." + enumerate what to
// preserve verbatim (posture, expression, accessories, background,
// framing, lighting). The identity + hygiene clauses are prepended by
// buildPrompt() at render time (or overridden by the AI refiner).

type Seed = {
  slug: string;
  label: string;
  localFile: string;
  sortOrder: number;
  promptBody: string;
};

const SEEDS: Seed[] = [
  {
    slug: "restaurant-terrace-black-tee",
    label: "Restaurant Terrace — Black Tee",
    sortOrder: 10,
    localFile: "restaurant-terrace-black-tee.webp",
    promptBody: [
      "Replace the man in the reference image with the man from the selfie photos.",
      "Keep absolutely everything else identical to the reference image:",
      "- Same body position and posture (seated at a restaurant table, upper body slightly turned to the right, forearms in front of him, one hand holding a smartphone, well-defined arms visible)",
      "- Same facial expression (relaxed, looking down at the phone, mouth closed)",
      "- Same accessories and clothing (fitted plain black crew-neck t-shirt, black cat-eye sunglasses on his face, thin silver bracelet on right wrist)",
      "- Same background (upscale outdoor restaurant terrace at golden hour, white tablecloth with hand-painted floral pattern, empty wine glasses and water glass, decorative dinner plate with blue/red floral motif on the table, cutlery on a white napkin, wooden pergola with beige canopy overhead, blurred lush green hedges and blurred restaurant patrons in the far background, warm ambient lamp glow)",
      "- Same framing and camera angle (three-quarter medium shot from slightly above, subject filling the left half of the frame, table filling the lower right)",
      "- Same lighting (warm golden-hour ambient light, soft directional light from camera-left, no harsh shadows)",
    ].join("\n"),
  },
  {
    slug: "sunset-garden-dog",
    label: "Sunset Garden Walk — Dog",
    sortOrder: 20,
    localFile: "sunset-garden-dog.webp",
    promptBody: [
      "Replace the man in the reference image with the man from the selfie photos.",
      "Keep absolutely everything else identical to the reference image:",
      "- Same body position and posture (mid-stride walking forward on a cobblestone path, looking down and to his left toward a dog, arms relaxed at his sides)",
      "- Same facial expression (calm, looking downward, mouth closed)",
      "- Same accessories and clothing (fitted deep burgundy short-sleeve polo shirt tucked in, straight-leg dark navy trousers, black low-profile loafers, small black rectangular sunglasses on his face)",
      "- Same dog in the foreground (black-and-white border collie walking away from camera, tail up, only rear half visible in lower-left)",
      "- Same background (Mediterranean landscaped garden at golden hour, cobblestone path receding into distance, tall umbrella pines and cypress trees glowing warm orange in the setting sun, white flowering oleander bushes on both sides, stone retaining wall on the right, clear blue evening sky)",
      "- Same framing and camera angle (full-body long shot from slightly below eye level, subject centered, path leading into depth)",
      "- Same lighting (warm golden-hour side light from camera-left, long soft shadows, high saturation on the tree canopies)",
    ].join("\n"),
  },
  {
    slug: "couch-dog-cuddle",
    label: "Couch — Dog Cuddle",
    sortOrder: 30,
    localFile: "couch-dog-cuddle.webp",
    promptBody: [
      "Replace the man in the reference image with the man from the selfie photos.",
      "Keep absolutely everything else identical to the reference image:",
      "- Same body position and posture (seated on a beige upholstered sofa, torso facing camera, right arm extended forward holding a small paper cup toward the lens, left arm around a dog on his lap)",
      "- Same facial expression (wide genuine smile showing top teeth, eyes bright and looking at camera)",
      "- Same accessories and clothing (relaxed-fit white button-up shirt with fine navy windowpane check, sleeves buttoned at the wrist, black straight trousers, black leather belt visible at the waist)",
      "- Same dog on his lap (medium-sized shaggy grey-and-white sheepadoodle facing camera, black button eyes barely visible under fur, black nose)",
      "- Same paper cup in his right hand (small pastel-blue paper cup with a printed golden retriever puppy graphic and small text)",
      "- Same background (bright interior living room, cream painted built-in cabinet on the left with black hinges, wall-mounted flat-screen TV on the right showing an aerial landscape image, dark wood console table below the TV with a small basket of soft toys, cream throw blanket draped over the sofa backrest, warm-toned hardwood floor)",
      "- Same framing and camera angle (medium shot from slightly below eye level, subject and dog centered)",
      "- Same lighting (warm indoor tungsten lighting, soft even fill across the face, gentle highlight on the shirt)",
    ].join("\n"),
  },
  {
    slug: "bathroom-mirror-black-vneck",
    label: "Bathroom Mirror — Black V-Neck",
    sortOrder: 40,
    localFile: "bathroom-mirror-black-vneck.webp",
    promptBody: [
      "Replace the man in the reference image with the man from the selfie photos.",
      "Keep absolutely everything else identical to the reference image:",
      "- Same body position and posture (standing mirror selfie, torso rotated slightly to camera-left, right hand raised at chest height holding a black iPhone, left hand tucked into the front waistband of the trousers)",
      "- Same facial expression (calm, looking down at the phone screen, lips relaxed and slightly parted)",
      "- Same accessories and clothing (long-sleeve fitted black V-neck polo/knit shirt with two visible buttons at the placket, thin gold chain necklace resting at the collarbone, thin silver bracelet on the right wrist, off-white trousers barely visible at the waist)",
      "- Same phone in his hand (black Apple iPhone 16 with large dual-camera bump)",
      "- Same background (modern bathroom with pale grey stone walls, black round rain shower head mounted on the left, glass shower divider forming a bright vertical strip on the right side of the frame, minimalist black hardware, faint reflection of the room in the mirror)",
      "- Same framing and camera angle (three-quarter portrait crop, subject filling the center of the frame from head to hip, phone in the mid-lower right)",
      "- Same lighting (cool even diffuse daylight from an unseen skylight, soft shadowless illumination on the face)",
      "- REMOVE any UI overlay if present in the reference (chat bubbles, Reply buttons, status bar, timestamps) — output a clean photo only.",
    ].join("\n"),
  },
  {
    slug: "paris-seine-bouquet",
    label: "Paris Seine — Rose Bouquet",
    sortOrder: 50,
    localFile: "paris-seine-bouquet.webp",
    promptBody: [
      "Replace the man in the reference image with the man from the selfie photos.",
      "Keep absolutely everything else identical to the reference image:",
      "- Same body position and posture (standing at three-quarter angle to camera, holding a large bouquet of roses at chest height with both hands, looking slightly to camera-right in soft profile)",
      "- Same facial expression (contemplative, calm, mouth closed, gaze off-camera)",
      "- Same accessories and clothing (crisp white short-sleeve linen button-up shirt half-tucked, matching white cotton trousers)",
      "- Same bouquet (large hot-pink / magenta roses wrapped in soft pink and lavender tissue paper with a small orange florist tag, sprigs of eucalyptus leaves peeking out)",
      "- Same background (Parisian riverbank on the Seine at golden hour, wide blue-grey river water filling the lower half, blurred green trees along the far bank, glass dome of the Grand Palais faintly visible on the right horizon)",
      "- Same framing and camera angle (medium shot from slightly below waist level, subject filling most of the upper half of the frame, water in the lower half)",
      "- Same lighting (warm late-golden-hour sunlight from camera-right on the face and bouquet, soft flat sky light, film-like grain)",
    ].join("\n"),
  },
];

function extToMime(ext: string): string {
  return ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
}

async function main() {
  let created = 0, skipped = 0, uploaded = 0;

  for (const seed of SEEDS) {
    const localPath = resolve(LOCAL_DIR, seed.localFile);
    const fileBuf = readFileSync(localPath);
    const ext = seed.localFile.split(".").pop() ?? "webp";
    const refPath = `templates/${seed.slug}.${ext}`;

    // 1. Upload (upsert:true so re-runs after prompt edits refresh the file).
    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(refPath, fileBuf, {
        contentType: extToMime(ext),
        upsert: true,
      });
    if (upErr) {
      console.error(`  ✗ upload failed for ${seed.slug}: ${upErr.message}`);
      continue;
    }
    uploaded++;

    // 2. Insert row — skip cleanly if slug already exists (idempotent).
    const { error: insErr } = await sb.from("dating_templates").insert({
      slug: seed.slug,
      label: seed.label,
      prompt: seed.promptBody,
      ref_image_path: refPath,
      active: true,
      sort_order: seed.sortOrder,
    });
    if (insErr) {
      if (insErr.message.includes("duplicate")) {
        console.log(`  ↷ ${seed.slug} — row exists, skipped insert (file re-uploaded)`);
        skipped++;
      } else {
        console.error(`  ✗ insert failed for ${seed.slug}: ${insErr.message}`);
      }
      continue;
    }
    console.log(`  ✓ ${seed.slug} → ${refPath}`);
    created++;
  }

  console.log(`\nUploaded ${uploaded}, created ${created}, skipped ${skipped} of ${SEEDS.length}.`);
}
main().catch(e => { console.error(e); process.exit(1); });

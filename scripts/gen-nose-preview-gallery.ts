// LOCAL tooling — generate the nose-shape gallery shown on /nose/preview.
// Every output is a single-attribute edit of the committed /nose/before.jpg,
// so the slider reads as "same woman, same photo, different nose".
// Local mocks first (public/_localmocks/, gitignored); review, then promote.
//   npx tsx scripts/gen-nose-preview-gallery.ts
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { generateImage, type ReferenceImage } from "../lib/nanoBanana";

const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const beforeBuf = readFileSync("public/nose/before.jpg");
const ref: ReferenceImage = { data: beforeBuf, mimeType: "image/jpeg" };

// The gallery flips between these images in place, so any drift in framing
// reads as the whole head jumping. Hence the framing clause is as loud as the
// edit itself.
const SAME = [
  "Return this exact same photograph of this exact same woman, unchanged, with",
  "ONLY the nose repainted. Identical framing and crop: the head must stay at",
  "exactly the same size and the same position in the frame — do not zoom, do",
  "not re-center, do not change the camera distance. Same strict side profile,",
  "same warm-grey studio backdrop, same lighting, same ponytail, same white",
  "t-shirt, same smile. Eyes, brows, lips, teeth, chin, jaw, ear, neck and skin",
  "must stay pixel-identical. Photorealistic, natural skin texture, no",
  "retouching of anything but the nose. The nose change here:",
].join(" ");

const SHAPES: { key: string; prompt: string }[] = [
  {
    // The anchor slide. Regenerated rather than reused from before.jpg so it
    // shares the framing of the eight edits — the gallery flips between them
    // in place, and a re-framed anchor reads as the head jumping.
    key: "original",
    prompt:
      "Keep the nose EXACTLY as it is — same hump, same bridge, same tip, same length, same nostrils. Change nothing at all in this photograph.",
  },
  {
    // The flagship result: the hump reads as gone from the thumbnail alone.
    key: "straight",
    prompt:
      "REMOVE the dorsal hump completely so the bridge is one perfectly STRAIGHT line from the root to the tip. Tip keeps its original angle and length.",
  },
  {
    key: "lifted",
    prompt:
      "KEEP the bridge as it is. Only ROTATE the nasal tip UPWARD by a clear amount so the tip is visibly lifted and the nostril line tilts up. Bridge unchanged, tip clearly lifted.",
  },
  {
    key: "slim",
    prompt:
      "SLIM the whole nose: a noticeably NARROWER, finer dorsum and a thinner, more defined tip, keeping the same profile line and the same length. Delicate and narrow, not shorter.",
  },
  {
    key: "slope",
    prompt:
      "LOWER the bridge into a soft CONCAVE ski-slope profile — a gentle scoop between the root and the tip, clearly lower than the original — with a small upturned tip.",
  },
  {
    key: "button",
    prompt:
      "A short, small BUTTON nose: clearly SHORTER and less projected than the original, small rounded tip, tip rotated up. The most petite result of the set.",
  },
  {
    key: "subtle",
    prompt:
      "A very CONSERVATIVE refinement: soften the hump only slightly and clean the tip, keeping the natural character of her nose. This one must stay the closest to the original.",
  },
  {
    key: "greek",
    prompt:
      "A strong straight GREEK profile: a perfectly straight, slightly HIGHER dorsum in one continuous line with the forehead, tip at the same height as the bridge. Elegant and strong, not small.",
  },
  {
    key: "short",
    prompt:
      "REDUCE the projection and the length: the nose sticks out noticeably LESS from the face and sits closer to the lip, keeping a straight bridge. Shorter and flatter, tip not upturned.",
  },
];

// `npx tsx scripts/gen-nose-preview-gallery.ts straight lifted` re-rolls just
// those two — one bad shape shouldn't cost eight generations.
const only = new Set(process.argv.slice(2));

async function main() {
  mkdirSync("public/_localmocks/nose/preview", { recursive: true });
  for (const s of SHAPES) {
    if (only.size && !only.has(s.key)) continue;
    console.log(`[gen-nose-preview] ${s.key}…`);
    const out = await generateImage({
      prompt: `${SAME} ${s.prompt}`,
      templateReference: ref,
      aspectRatio: "3:4",
      resolution: "2K",
      thinkingLevel: "high",
    });
    writeFileSync(`public/_localmocks/nose/preview/${s.key}.png`, out.imageBytes);
    console.log(`[gen-nose-preview] ✅ ${s.key} (${out.imageBytes.length} bytes)`);
  }
}

main().catch((e) => {
  console.error("[gen-nose-preview] ❌", e?.message || e);
  process.exit(1);
});

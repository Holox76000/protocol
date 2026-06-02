/**
 * Copies Skinny_Caucasian_20-29 from user-photos/offer-images/ to offer-images/ (public bucket).
 */
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const FILES = [
  "result-1-before.png", "result-1-after.png",
  "result-2-before.png", "result-2-after.png",
  "result-3-before.png", "result-3-after.png",
  "portrait.png",
];
const KEY = "Skinny_Caucasian_20-29";

async function main() {
  for (const file of FILES) {
    const srcPath = `offer-images/${KEY}/${file}`;
    const dstPath = `${KEY}/${file}`;

    const { data, error: dlErr } = await supabase.storage.from("user-photos").download(srcPath);
    if (dlErr || !data) {
      console.error(`✗ download failed: ${srcPath}`, dlErr?.message);
      continue;
    }

    const buf = Buffer.from(await data.arrayBuffer());
    const contentType = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const { error: upErr } = await supabase.storage.from("offer-images").upload(dstPath, buf, {
      contentType,
      upsert: true,
    });

    if (upErr) {
      console.error(`✗ upload failed: ${dstPath}`, upErr.message);
    } else {
      const { data: urlData } = supabase.storage.from("offer-images").getPublicUrl(dstPath);
      console.log(`✓ ${file} → ${urlData.publicUrl}`);
    }
  }
}

main().catch(console.error);

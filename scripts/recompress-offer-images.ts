/**
 * Re-compress existing offer images in Supabase to JPEG (before/after) and sized PNG (portrait).
 * Run with: npx tsx /tmp/recompress-offer-images.ts
 */
import sharp from "sharp";

const SUPABASE_URL = "https://ogpnrtebcmqazzyynosl.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncG5ydGViY21xYXp6eXlub3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY0Nzc2NywiZXhwIjoyMDg4MjIzNzY3fQ.rTPkfeSZ2VKqG30Viy_VvTEagqVZwOd3PLPicQhAngM";
const BUCKET = "user-photos";
const BASE = "offer-images";
const REQUIRED = ["result-1-before.png","result-1-after.png","result-2-before.png","result-2-after.png","result-3-before.png","result-3-after.png","portrait.png"];
const HEADERS = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function listFiles(folder: string) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST", headers: HEADERS,
    body: JSON.stringify({ prefix: `${BASE}/${folder}/`, limit: 100 }),
  });
  return (await res.json() as { name: string; metadata?: { size?: number } }[]) || [];
}

async function downloadFile(path: string): Promise<Buffer | null> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    headers: { Authorization: `Bearer ${KEY}` }
  });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function uploadFile(path: string, data: Buffer, mime: string) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": mime, "x-upsert": "true" },
    body: data,
  });
  return res.ok;
}

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(SUPABASE_URL, KEY);

async function getAllFolders() {
  const { data } = await supabase.storage.from(BUCKET).list(BASE, { limit: 200 });
  return (data ?? []).map(f => f.name).filter(n => !n.startsWith("test"));
}

async function main() {
  const folders = await getAllFolders();
  console.log(`Found ${folders.length} folders`);
  
  let compressed = 0, skipped = 0;
  
  for (const folder of folders) {
    const files = await listFiles(folder);
    const fileMap = new Map(files.map(f => [f.name, f.metadata?.size ?? 0]));
    
    for (const filename of REQUIRED) {
      const size = fileMap.get(filename) ?? 0;
      const path = `${BASE}/${folder}/${filename}`;
      
      // Skip if already small enough (< 300KB for before/after, < 500KB for portrait)
      const threshold = filename === "portrait.png" ? 500_000 : 300_000;
      if (size > 0 && size < threshold) {
        skipped++;
        continue;
      }
      if (size === 0) { skipped++; continue; }
      
      const buf = await downloadFile(path);
      if (!buf) { console.log(`  ✗ download failed: ${path}`); continue; }
      
      try {
        let compressed_buf: Buffer;
        if (filename === "portrait.png") {
          compressed_buf = await sharp(buf)
            .resize(500, 750, { fit: "inside", withoutEnlargement: true })
            .png({ compressionLevel: 8 })
            .toBuffer();
          await uploadFile(path, compressed_buf, "image/png");
        } else {
          compressed_buf = await sharp(buf)
            .resize(600, 900, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 82 })
            .toBuffer();
          await uploadFile(path, compressed_buf, "image/jpeg");
        }
        const ratio = Math.round((1 - compressed_buf.length / size) * 100);
        console.log(`  ✓ ${folder}/${filename}: ${Math.round(size/1024)}KB → ${Math.round(compressed_buf.length/1024)}KB (-${ratio}%)`);
        compressed++;
      } catch (e) {
        console.log(`  ✗ compress error ${path}:`, e);
      }
    }
  }
  console.log(`\nDone: ${compressed} compressed, ${skipped} skipped`);
}

main().catch(console.error);

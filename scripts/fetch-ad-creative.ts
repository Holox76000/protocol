import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const AD_ID = process.argv[2] ?? "120249601537790660";
const TOKEN = process.env.META_ADS_READ_TOKEN ?? process.env.META_ACCESS_TOKEN;

async function main() {
  const fields = [
    "name",
    "status",
    "adset{name}",
    "campaign{name}",
    "creative{id,name,title,body,object_story_spec,asset_feed_spec,url_tags,instagram_permalink_url,effective_object_story_id}",
  ].join(",");
  const res = await fetch(`https://graph.facebook.com/v22.0/${AD_ID}?fields=${fields}&access_token=${TOKEN}`);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });

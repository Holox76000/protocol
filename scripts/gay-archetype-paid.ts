import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const GAY_BI_PAID = [
  "benj.brees@gmail.com",
  "stephen.tomac@gmail.com",
  "sherif.haikal@gmail.com",
  "dj@djcap.net",
  "higpeter@gmail.com",
  "kyle.k.vernor@gmail.com",
];

async function main() {
  for (const email of GAY_BI_PAID) {
    const { data: usr } = await sb.from("users").select("id, first_name, email").ilike("email", email).maybeSingle();
    if (!usr) { console.log(`${email}: no user`); continue; }
    const { data: qr } = await sb.from("questionnaire_responses").select("*").eq("user_id", usr.id).maybeSingle();
    
    console.log(`\n══════════════════════════════════════════════════════════════`);
    console.log(`${email}  (${usr.first_name})`);
    console.log(`══════════════════════════════════════════════════════════════`);
    
    if (!qr) { console.log("(no qr)"); continue; }
    const fields = [
      "sexual_orientation", "age_bracket", "morphology", "ethnicity",
      "height_cm", "height_ft", "height_in", "weight_kg", "weight_lbs",
      "weekly_time", "training_consistency", "sleep_hours", "stress_level",
      "concern_areas", "physique_goal", "dream_outcome", "pain_friction",
      "past_solutions", "facial_hair", "body_hair", "professional_environment",
    ];
    for (const f of fields) {
      const v = (qr as any)[f];
      if (v !== null && v !== undefined && v !== "") {
        const display = typeof v === "object" ? JSON.stringify(v) : String(v);
        console.log(`  ${f.padEnd(28)} ${display.slice(0, 200)}`);
      }
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });

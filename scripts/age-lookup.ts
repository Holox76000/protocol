import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const EMAILS = ["benj.brees@gmail.com", "stephen.tomac@gmail.com", "sherif.haikal@gmail.com", "dj@djcap.net", "higpeter@gmail.com", "kyle.k.vernor@gmail.com"];

async function main() {
  for (const email of EMAILS) {
    // Try funnel_sessions for age
    const { data: fs } = await sb.from("funnel_sessions").select("answers").ilike("answers->>email", email).order("created_at", { ascending: false }).limit(1);
    const a = fs?.[0]?.answers as any;
    
    // Also check if questionnaire has any age/birthdate field
    const { data: usr } = await sb.from("users").select("id").ilike("email", email).maybeSingle();
    let qrAge = null;
    if (usr) {
      const { data: qr } = await sb.from("questionnaire_responses").select("*").eq("user_id", usr.id).maybeSingle();
      // Check for any age-related fields
      qrAge = (qr as any)?.age_bracket ?? (qr as any)?.age ?? (qr as any)?.birth_year ?? (qr as any)?.date_of_birth ?? null;
      // Also list any field with age in the name
      if (qr) {
        const ageRelated = Object.keys(qr).filter(k => /age|birth|year/i.test(k));
        if (ageRelated.length) console.log(`  ${email}: qr age-related fields: ${ageRelated.join(", ")}`);
      }
    }
    
    console.log(`${email.padEnd(36)}  funnel_age=${a?.age_bracket ?? "—"}  qr_age=${qrAge ?? "—"}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });

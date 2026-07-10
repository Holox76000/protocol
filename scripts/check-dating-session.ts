import { readFileSync } from "fs";
import { resolve } from "path";
try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const s = await stripe.checkout.sessions.retrieve(process.argv[2]!);
  console.log(JSON.stringify({
    amount_total: s.amount_total,
    currency: s.currency,
    success_url: s.success_url,
    cancel_url: s.cancel_url,
    metadata: s.metadata,
    status: s.status,
  }, null, 2));

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error, count } = await sb.from("dating_orders").select("id", { count: "exact", head: true });
  console.log("dating_orders table:", error ? `ERROR ${error.message}` : `OK (${count} rows)`);
}
main().catch((e) => { console.error(e); process.exit(1); });

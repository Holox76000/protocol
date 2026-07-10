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

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

  const product = await stripe.products.create({
    name: "Protocol Dating — AI Dating Photos",
    description: "30 AI-generated dating profile photos, 5 styles, 24h delivery",
  });
  console.log("Product created:", product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 3900,
    currency: "usd",
  });
  console.log("Price created:", price.id);
  console.log(`\nAdd to .env.local:\nSTRIPE_DATING_PRICE_ID=${price.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

import { readFileSync } from "fs";
import { resolve } from "path";
import Stripe from "stripe";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

async function getCustomerInfo(email: string) {
  const customers = await stripe.customers.list({ email, limit: 5 });
  const results: Record<string, unknown>[] = [];

  for (const customer of customers.data) {
    const paymentMethods = await stripe.paymentMethods.list({ customer: customer.id, limit: 10 });
    const paymentIntents = await stripe.paymentIntents.list({ customer: customer.id, limit: 10 });

    results.push({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      created: new Date(customer.created * 1000).toISOString(),
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
          fingerprint: pm.card.fingerprint,
        } : null,
      })),
      paymentIntents: paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount / 100,
        status: pi.status,
        created: new Date(pi.created * 1000).toISOString(),
        metadata: pi.metadata,
      })),
    });
  }

  return results;
}

async function main() {
  console.log("=== plourde.matt@gmail.com ===");
  const matt = await getCustomerInfo("plourde.matt@gmail.com");
  console.log(JSON.stringify(matt, null, 2));

  console.log("\n=== nachoscl@hotmail.com ===");
  const nacho = await getCustomerInfo("nachoscl@hotmail.com");
  console.log(JSON.stringify(nacho, null, 2));

  // Compare card fingerprints
  const mattFingerprints = matt.flatMap((c: any) => c.paymentMethods.map((pm: any) => pm.card?.fingerprint)).filter(Boolean);
  const nachoFingerprints = nacho.flatMap((c: any) => c.paymentMethods.map((pm: any) => pm.card?.fingerprint)).filter(Boolean);

  const commonFingerprints = mattFingerprints.filter((f: any) => nachoFingerprints.includes(f));

  console.log("\n=== RÉSUMÉ ===");
  console.log("Fingerprints Matt:", mattFingerprints);
  console.log("Fingerprints Nacho:", nachoFingerprints);
  console.log("Fingerprints en commun:", commonFingerprints.length > 0 ? commonFingerprints : "Aucun");
}

main().catch(console.error);

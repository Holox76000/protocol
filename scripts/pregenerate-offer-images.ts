/**
 * Pre-generates all 96 profile combinations for the /f1/offer personalized images.
 *
 * Usage:
 *   PREGENERATE_SECRET=<secret> BASE_URL=http://localhost:3000 npx tsx scripts/pregenerate-offer-images.ts
 *
 * In production:
 *   PREGENERATE_SECRET=<secret> BASE_URL=https://your-domain.com npx tsx scripts/pregenerate-offer-images.ts
 *
 * The script runs combinations sequentially to stay within the Gemini 1000 req/day quota.
 * Each combination uses 7 Gemini calls → 96 combinations = 672 calls total (~1 day of quota).
 * Already-generated combinations are skipped automatically.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.PREGENERATE_SECRET ?? "";

const MORPHOLOGIES = ["Skinny", "Skinny-fat", "Overweight", "Average"];
const ETHNICITIES = ["Caucasian", "Black", "Asian (East / SE)", "South Asian", "Hispanic-Latino", "MENA"];
const AGE_BRACKETS = ["20-29", "30-39", "40-49", "50+"];

type StatusResponse = { status: string };

async function checkStatus(morphology: string, ethnicity: string, ageBracket: string): Promise<string> {
  const url = `${BASE_URL}/api/offer/personalized-images?age_bracket=${encodeURIComponent(ageBracket)}&morphology=${encodeURIComponent(morphology)}&ethnicity=${encodeURIComponent(ethnicity)}`;
  const res = await fetch(url);
  const data = await res.json() as StatusResponse;
  return data.status;
}

async function triggerGeneration(morphology: string, ethnicity: string, ageBracket: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/offer/personalized-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ age_bracket: ageBracket, morphology, ethnicity, secret: SECRET }),
  });
  const data = await res.json() as StatusResponse;
  return data.status;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCompletion(morphology: string, ethnicity: string, ageBracket: string): Promise<"done" | "error"> {
  const maxWaitMinutes = 15;
  const pollInterval = 15_000;
  const maxAttempts = (maxWaitMinutes * 60 * 1000) / pollInterval;

  // Wait before first poll — generation can take 30s–3min
  await sleep(10_000);

  let notReadyStreak = 0;
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkStatus(morphology, ethnicity, ageBracket);
    if (status === "done") return "done";
    if (status === "generating") {
      notReadyStreak = 0;
      process.stdout.write(".");
      await sleep(pollInterval);
      continue;
    }
    // "not_ready" — could mean: sentinel never written (but generation may still be running),
    // or generation completed too fast to detect, or truly failed.
    // Give it 3 consecutive not_ready before giving up.
    notReadyStreak++;
    if (notReadyStreak >= 3) return "error";
    await sleep(10_000);
  }
  return "error"; // timeout
}

async function main() {
  if (!SECRET) {
    console.error("❌  PREGENERATE_SECRET env var is required");
    process.exit(1);
  }

  const all = MORPHOLOGIES.flatMap((m) => ETHNICITIES.flatMap((e) => AGE_BRACKETS.map((a) => ({ m, e, a }))));
  console.log(`Starting pre-generation of ${all.length} combinations (${all.length * 7} Gemini calls)\n`);

  let done = 0, skipped = 0, failed = 0;

  for (const { m, e, a } of all) {
    const label = `${m} / ${e} / ${a}`;

    // Check if already cached
    const currentStatus = await checkStatus(m, e, a);
    if (currentStatus === "done") {
      console.log(`  ✓ skip   ${label}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ⏳ start  ${label} `);

    const triggerStatus = await triggerGeneration(m, e, a);
    if (triggerStatus === "done") {
      console.log("→ already done");
      skipped++;
      continue;
    }

    let result = await waitForCompletion(m, e, a);

    // If first attempt failed, retry once after a pause
    if (result === "error") {
      console.log(` ↻ retry`);
      await sleep(30_000); // wait 30s before retrying
      const retryTrigger = await triggerGeneration(m, e, a);
      if (retryTrigger === "done") {
        result = "done";
      } else {
        result = await waitForCompletion(m, e, a);
      }
    }

    if (result === "done") {
      console.log(` ✓ done`);
      done++;
    } else {
      console.log(` ✗ FAILED`);
      failed++;
    }
  }

  console.log(`\n✅ Done: ${done}  Skipped: ${skipped}  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

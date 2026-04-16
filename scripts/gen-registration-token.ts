import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const EMAIL = "plourde.matt@gmail.com";
const FIRST_NAME = "Matthew";
const SITE_URL = "https://protocol-club.com";
const EXPIRY_DAYS = 7;

function generateRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function main() {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Invalider les anciens tokens
  await sb.from("registration_tokens").update({ used: true }).eq("email", EMAIL).eq("used", false);

  const { error } = await sb.from("registration_tokens").insert({
    token_hash: tokenHash,
    email: EMAIL,
    first_name: FIRST_NAME,
    stripe_customer_id: null,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Erreur: ${error.message}`);

  const url = `${SITE_URL}/register?token=${token}`;
  console.log(`\nEmail : ${EMAIL}`);
  console.log(`URL   : ${url}`);
  console.log(`Expire: ${expiresAt}`);
}

main().catch(console.error);

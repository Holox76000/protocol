// Unsubscribe-token helpers, deliberately kept free of `import "server-only"`.
//
// `lib/email.ts` needs createUnsubscribeToken, and `lib/email.ts` is pulled into
// standalone Netlify Functions (e.g. dating-generate-bg-background) via
// lib/datingGeneration. lib/auth.ts starts with `import "server-only"`, which the
// esbuild function bundler cannot resolve outside Next.js — so the email path must
// not transit through lib/auth. These two functions only need crypto + Supabase,
// so they live here and lib/auth re-exports them for its existing importers.

import crypto from "node:crypto";
import { supabaseAdmin } from "./supabase";

const UNSUBSCRIBE_TOKEN_DURATION_DAYS = 365;

function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createUnsubscribeToken(email: string): Promise<string> {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + UNSUBSCRIBE_TOKEN_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabaseAdmin.from("unsubscribe_tokens").insert({
    token_hash: tokenHash,
    email: email.toLowerCase(),
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Unsubscribe token creation failed: ${error.message}`);

  return token;
}

export async function verifyUnsubscribeToken(token: string): Promise<{ email: string } | null> {
  const tokenHash = hashToken(token);

  const { data, error } = await supabaseAdmin
    .from("unsubscribe_tokens")
    .select("email")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return { email: data.email as string };
}

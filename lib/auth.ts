import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabase";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
export const SESSION_COOKIE_NAME = "prtcl_session";
const SESSION_DURATION_DAYS = 30;
const BCRYPT_ROUNDS = 10;
const REGISTRATION_TOKEN_DURATION_DAYS = 7;

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  first_name: string;
  has_paid: boolean;
  protocol_status: string;
};

// ──────────────────────────────────────────────
// Rate limiting (in-memory)
// Note: resets per serverless instance — acceptable
// at low traffic. Upgrade to Supabase-backed table
// at >1000 req/min.
// ──────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// ──────────────────────────────────────────────
// Password
// ──────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ──────────────────────────────────────────────
// Token utilities
// ──────────────────────────────────────────────
function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ──────────────────────────────────────────────
// Session management
// ──────────────────────────────────────────────
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabaseAdmin.from("sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ipAddress ?? null,
    user_agent: userAgent ?? null,
  });

  if (error) throw new Error(`Session creation failed: ${error.message}`);

  // Update last_login_at
  await supabaseAdmin
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);

  return token;
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const tokenHash = hashToken(token);

  const { data: session, error } = await supabaseAdmin
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !session) return null;
  if (new Date(session.expires_at as string) < new Date()) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, has_paid, protocol_status")
    .eq("id", session.user_id)
    .maybeSingle();

  return (user as AuthUser) ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await supabaseAdmin.from("sessions").delete().eq("token_hash", tokenHash);
}

// ──────────────────────────────────────────────
// Registration tokens (post-purchase pre-fill)
// ──────────────────────────────────────────────
export async function createRegistrationToken(params: {
  email: string;
  firstName?: string;
  stripeCustomerId?: string;
}): Promise<string> {
  const token = generateRandomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + REGISTRATION_TOKEN_DURATION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Upsert: invalidate any previous unused token for this email
  await supabaseAdmin
    .from("registration_tokens")
    .update({ used: true })
    .eq("email", params.email.toLowerCase())
    .eq("used", false);

  const { error } = await supabaseAdmin.from("registration_tokens").insert({
    token_hash: tokenHash,
    email: params.email.toLowerCase(),
    first_name: params.firstName ?? null,
    stripe_customer_id: params.stripeCustomerId ?? null,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Token creation failed: ${error.message}`);

  return token;
}

export async function consumeRegistrationToken(token: string): Promise<{
  email: string;
  firstName: string | null;
  stripeCustomerId: string | null;
} | null> {
  const tokenHash = hashToken(token);

  const { data, error } = await supabaseAdmin
    .from("registration_tokens")
    .select("email, first_name, stripe_customer_id, expires_at, used")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;

  // Mark as used
  await supabaseAdmin
    .from("registration_tokens")
    .update({ used: true })
    .eq("token_hash", tokenHash);

  return {
    email: data.email as string,
    firstName: (data.first_name as string) ?? null,
    stripeCustomerId: (data.stripe_customer_id as string) ?? null,
  };
}

// Preview token data without consuming it (for pre-filling the form)
export async function peekRegistrationToken(token: string): Promise<{
  email: string;
  firstName: string | null;
} | null> {
  const tokenHash = hashToken(token);

  const { data, error } = await supabaseAdmin
    .from("registration_tokens")
    .select("email, first_name, expires_at, used")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;

  return {
    email: data.email as string,
    firstName: (data.first_name as string) ?? null,
  };
}

// ──────────────────────────────────────────────
// Cookie config (used by API routes via NextResponse)
// ──────────────────────────────────────────────
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  path: "/",
};

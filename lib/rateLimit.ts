import "server-only";
import { supabaseAdmin } from "./supabase";

// ──────────────────────────────────────────────────────────────
// Shared, persistent rate limiter.
//
// Backed by the `rate_limits` table + `increment_rate_limit(...)` RPC
// (see supabase/migrations/033_rate_limits.sql) so the limit is enforced
// across every serverless instance — unlike the per-instance in-memory
// counters in lib/auth, which an attacker bypasses by hitting many lambdas.
//
// Fail-open: if the DB/RPC is unavailable we fall back to a per-instance
// in-memory counter (still better than nothing) and never lock real users
// out because of a transient database issue.
// ──────────────────────────────────────────────────────────────

const memory = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = { ok: boolean; count: number };

export async function rateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): Promise<RateLimitResult> {
  const { max, windowMs } = opts;
  const windowStartMs = Math.floor(Date.now() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();

  try {
    const { data, error } = await supabaseAdmin.rpc("increment_rate_limit", {
      p_key: key,
      p_window_start: windowStart,
    });
    if (error) throw new Error(error.message);
    const count = typeof data === "number" ? data : Number(data);
    if (!Number.isFinite(count)) throw new Error("increment_rate_limit returned non-numeric");
    return { ok: count <= max, count };
  } catch (err) {
    console.error("[rateLimit] persistent limiter unavailable — in-memory fallback", {
      error: String(err),
      key,
    });
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || now > entry.resetAt) {
      memory.set(key, { count: 1, resetAt: windowStartMs + windowMs });
      return { ok: 1 <= max, count: 1 };
    }
    entry.count += 1;
    return { ok: entry.count <= max, count: entry.count };
  }
}

// Best-effort client IP from the platform's forwarding headers.
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

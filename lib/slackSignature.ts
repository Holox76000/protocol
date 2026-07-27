// Verifies the Slack signature on an incoming Events API request.
// Docs: https://api.slack.com/authentication/verifying-requests-from-slack
//
// Slack signs each request as HMAC-SHA256(signingSecret, `v0:${ts}:${body}`)
// and passes the digest in `x-slack-signature`. We recompute and compare
// in constant time. Also rejects requests older than 5 minutes (replay
// protection).

import { createHmac, timingSafeEqual } from "crypto";

const REPLAY_WINDOW_SEC = 5 * 60;

export function verifySlackSignature(args: {
  signingSecret: string;
  timestampHeader: string | null;
  signatureHeader: string | null;
  rawBody: string;
}): { ok: true } | { ok: false; reason: string } {
  const { signingSecret, timestampHeader, signatureHeader, rawBody } = args;
  if (!signingSecret) return { ok: false, reason: "signing secret not set" };
  if (!timestampHeader || !signatureHeader) return { ok: false, reason: "missing signature headers" };

  const ts = parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: "invalid timestamp" };

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > REPLAY_WINDOW_SEC) return { ok: false, reason: "timestamp outside replay window" };

  const base = `v0:${timestampHeader}:${rawBody}`;
  const digest = createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${digest}`;

  // Constant-time compare to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}

// Compute the nurture sequence anchor time so every step lands in the US peak
// inbox window. Anchor = 14:00 UTC = 10am ET / 7am PT.
//
// Why this matters: the cron fires when `nurture_starts_at + DELAY ≤ now`.
// Every nurture step (E2 = +24h, E3 = +48h, ..., E7 = +13d) uses the same
// anchor, so aligning the anchor to 14:00 UTC makes every step land at 14:00
// UTC — top of the engagement window — without any per-step logic.
//
// Rule:
//   if NOW.utcHour < 22  → today's 14:00 UTC
//   else                  → tomorrow's 14:00 UTC
//
// This gives an E2 delay in [17h, 40h] depending on the opt-in time. Slightly
// non-uniform but every send is in peak. Trade-off worth it.

const PEAK_HOUR_UTC = 14;
const CUTOFF_HOUR_UTC = 22; // past this we shift to tomorrow's window

export function computeNurtureStartsAt(now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);

  if (now.getUTCHours() < CUTOFF_HOUR_UTC) {
    d.setUTCHours(PEAK_HOUR_UTC);
  } else {
    d.setUTCDate(d.getUTCDate() + 1);
    d.setUTCHours(PEAK_HOUR_UTC);
  }

  return d.toISOString();
}

// ─── Variant toggle ─────────────────────────────────────────────────────────
// Change ACTIVE_VARIANT to 'projection' to enable the projection iteration.
// One commit = on/off. URL param ?variant=projection overrides for local testing.

export type Variant = "default" | "projection";

export const ACTIVE_VARIANT: Variant = "projection";

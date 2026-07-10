/**
 * Tests for getAdVariant — ad_id → landing copy variant mapping.
 * Covers the new Mediads carousel entry (2026-07-06) and fallbacks.
 */

import { describe, it, expect } from "vitest";
import { getAdVariant, DEFAULT_VARIANT } from "./ad-variants";

describe("getAdVariant", () => {
  it("maps the new Mediads bear carousel ad to GAY_STANDARD_BEAR", () => {
    const variant = getAdVariant("120249601537790660");
    expect(variant.badge).toBe("Gay beauty standard · Bear");
    expect(variant.headline).toMatch(/bears are sitting on more potential/i);
    expect(variant.subtext.length).toBeGreaterThan(0);
    expect(variant.cta).toBe("Get my free analysis →");
  });

  it("falls back to DEFAULT_VARIANT for unknown ad ids", () => {
    expect(getAdVariant("999999999999999999")).toBe(DEFAULT_VARIANT);
  });

  it("falls back to DEFAULT_VARIANT when ad id is undefined", () => {
    expect(getAdVariant(undefined)).toBe(DEFAULT_VARIANT);
  });
});

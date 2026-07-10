/**
 * Tests for getCheckoutLineItems — Stripe line-item resolution per funnel.
 *
 * The "dating" branch is new (Protocol Dating, $39). The f1 branch is the
 * pre-existing $89 path and is covered as a regression guard because the
 * checkout route around it was refactored (product object extraction).
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { getCheckoutLineItems } from "./stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCheckoutLineItems — dating funnel", () => {
  it("uses STRIPE_DATING_PRICE_ID when set", () => {
    vi.stubEnv("STRIPE_DATING_PRICE_ID", "price_dating_123");
    expect(getCheckoutLineItems("dating")).toEqual([
      { price: "price_dating_123", quantity: 1 },
    ]);
  });

  it("falls back to inline $39 price_data when STRIPE_DATING_PRICE_ID is unset or blank", () => {
    vi.stubEnv("STRIPE_DATING_PRICE_ID", "");
    const items = getCheckoutLineItems("dating");
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].price_data).toMatchObject({
      currency: "usd",
      unit_amount: 3900,
      product_data: {
        name: "Protocol Dating — AI Dating Photos",
      },
    });

    // Whitespace-only id must also be treated as unset (the code trims).
    vi.stubEnv("STRIPE_DATING_PRICE_ID", "   ");
    expect(getCheckoutLineItems("dating")[0].price_data?.unit_amount).toBe(3900);
  });
});

describe("getCheckoutLineItems — f1 regression", () => {
  it("still returns the $89 Attractiveness Protocol when STRIPE_F1_PRICE_ID is unset", () => {
    vi.stubEnv("STRIPE_F1_PRICE_ID", "");
    const items = getCheckoutLineItems("f1");
    expect(items).toHaveLength(1);
    expect(items[0].price_data).toMatchObject({
      currency: "usd",
      unit_amount: 8900,
      product_data: {
        name: "Attractiveness Protocol — 3-Month Program",
      },
    });
  });

  it("still uses STRIPE_F1_PRICE_ID when set", () => {
    vi.stubEnv("STRIPE_F1_PRICE_ID", "price_f1_456");
    expect(getCheckoutLineItems("f1")).toEqual([
      { price: "price_f1_456", quantity: 1 },
    ]);
  });
});

describe("getCheckoutLineItems — default funnel", () => {
  it("returns the default $19 product when no funnel and no STRIPE_PRICE_ID", () => {
    vi.stubEnv("STRIPE_PRICE_ID", "");
    const items = getCheckoutLineItems();
    expect(items[0].price_data).toMatchObject({
      currency: "usd",
      unit_amount: 1900,
      product_data: {
        name: "Body Analysis + Body Transformation Protocol",
      },
    });
  });

  it("routes unknown funnels to the default branch, not dating or f1", () => {
    vi.stubEnv("STRIPE_PRICE_ID", "");
    vi.stubEnv("STRIPE_DATING_PRICE_ID", "price_dating_123");
    const items = getCheckoutLineItems("something-else");
    expect(items[0].price_data?.unit_amount).toBe(1900);
  });
});

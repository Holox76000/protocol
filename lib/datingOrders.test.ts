/**
 * Tests for lib/datingOrders.ts — Protocol Dating order helpers.
 *
 * isValidCheckoutSessionId is pure. getOrCreateDatingOrder talks to
 * Supabase and Stripe, both mocked at the local-module boundary
 * (lib/supabase throws at import time without env vars, so it must be
 * factory-mocked before the module under test loads).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const single = vi.fn();
  const upsert = vi.fn(() => ({ select: () => ({ single }) }));
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle }) }),
    upsert,
  }));
  const retrieve = vi.fn();
  const getStripeServerClient = vi.fn(() => ({
    checkout: { sessions: { retrieve } },
  }));
  return { maybeSingle, single, upsert, from, retrieve, getStripeServerClient };
});

vi.mock("./supabase", () => ({ supabaseAdmin: { from: mocks.from } }));
vi.mock("./stripe", () => ({ getStripeServerClient: mocks.getStripeServerClient }));

import { isValidCheckoutSessionId, getOrCreateDatingOrder } from "./datingOrders";

describe("isValidCheckoutSessionId", () => {
  it("accepts well-formed Stripe checkout session ids", () => {
    expect(isValidCheckoutSessionId("cs_test_a1B2c3xyz")).toBe(true);
    expect(isValidCheckoutSessionId("cs_live_ABC_123")).toBe(true);
  });

  it("rejects ids without the cs_ prefix", () => {
    expect(isValidCheckoutSessionId("pi_3abc123")).toBe(false);
    expect(isValidCheckoutSessionId("sess_123")).toBe(false);
    expect(isValidCheckoutSessionId("xcs_123")).toBe(false);
  });

  it("rejects cs_ ids containing illegal characters", () => {
    expect(isValidCheckoutSessionId("cs_abc-def")).toBe(false);
    expect(isValidCheckoutSessionId("cs_abc def")).toBe(false);
    expect(isValidCheckoutSessionId("cs_abc$")).toBe(false);
    expect(isValidCheckoutSessionId("cs_abc.def")).toBe(false);
  });

  it("rejects bare prefix and empty string", () => {
    expect(isValidCheckoutSessionId("cs_")).toBe(false);
    expect(isValidCheckoutSessionId("")).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isValidCheckoutSessionId(null)).toBe(false);
    expect(isValidCheckoutSessionId(undefined)).toBe(false);
  });
});

describe("getOrCreateDatingOrder", () => {
  const existingOrder = {
    id: "row-1",
    stripe_session_id: "cs_test_abc",
    email: "buyer@example.com",
    first_name: "Marc",
    status: "paid",
    photo_paths: [],
    photos_count: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing row without calling Stripe", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: existingOrder });

    const order = await getOrCreateDatingOrder("cs_test_abc");

    expect(order).toEqual(existingOrder);
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns null when the Stripe session is unpaid or not a dating order", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });

    mocks.retrieve.mockResolvedValueOnce({
      payment_status: "unpaid",
      metadata: { funnel: "dating" },
    });
    expect(await getOrCreateDatingOrder("cs_test_unpaid")).toBeNull();

    mocks.retrieve.mockResolvedValueOnce({
      payment_status: "paid",
      metadata: { funnel: "f1" },
    });
    expect(await getOrCreateDatingOrder("cs_test_wrongfunnel")).toBeNull();

    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns null when Stripe session retrieval throws", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    mocks.retrieve.mockRejectedValue(new Error("No such session"));

    expect(await getOrCreateDatingOrder("cs_test_missing")).toBeNull();
  });

  it("returns null when the paid session has no customer email", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    mocks.retrieve.mockResolvedValue({
      payment_status: "paid",
      metadata: { funnel: "dating" },
      customer_details: { email: null, name: "John Doe" },
    });

    expect(await getOrCreateDatingOrder("cs_test_noemail")).toBeNull();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("creates the order from a paid dating session (lowercased email, parsed first name)", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    mocks.retrieve.mockResolvedValue({
      payment_status: "paid",
      metadata: { funnel: "dating", utm_source: "meta", utm_campaign: "launch" },
      amount_total: 3900,
      customer_details: { email: "John@Example.COM", name: "John Ronald Doe" },
    });
    const created = { ...existingOrder, email: "john@example.com", first_name: "John" };
    mocks.single.mockResolvedValue({ data: created, error: null });

    const order = await getOrCreateDatingOrder("cs_test_new");

    expect(order).toEqual(created);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: "cs_test_new",
        email: "john@example.com",
        first_name: "John",
        amount_cents: 3900,
        utm_source: "meta",
        utm_campaign: "launch",
      }),
      { onConflict: "stripe_session_id" }
    );
  });
});

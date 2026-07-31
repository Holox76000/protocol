/**
 * Test for sendDatingConfirmationEmail — Protocol Dating post-purchase email.
 *
 * The resend SDK is factory-mocked; ./auth is mocked because it transitively
 * imports "server-only" and lib/supabase (both throw under vitest node env).
 */

import { describe, it, expect, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));
vi.mock("./unsubscribeToken", () => ({
  createUnsubscribeToken: vi.fn(() => "tok"),
}));

import { sendDatingConfirmationEmail } from "./email";

describe("sendDatingConfirmationEmail", () => {
  it("sends the confirmation with the upload link and personalized greeting", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    sendMock.mockResolvedValue({ error: null });

    await sendDatingConfirmationEmail({
      email: "buyer@example.com",
      firstName: "Marc",
      uploadUrl: "https://protocol-club.com/dating/success?session_id=cs_test_abc",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe("buyer@example.com");
    expect(args.subject).toBe("Your order is confirmed — upload your photos");
    expect(args.html).toContain("Hey Marc");
    expect(args.html).toContain(
      "https://protocol-club.com/dating/success?session_id=cs_test_abc"
    );

    vi.unstubAllEnvs();
  });
});

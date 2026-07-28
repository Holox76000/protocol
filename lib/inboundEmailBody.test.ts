import { describe, it, expect } from "vitest";
import { fetchInboundBody, htmlToText, BODY_UNAVAILABLE, type InboundEmailFetcher } from "./inboundEmailBody";

function fetcher(resp: unknown): InboundEmailFetcher {
  return { emails: { receiving: { get: async () => resp as never } } };
}

describe("fetchInboundBody", () => {
  it("extracts the body via emails.receiving.get (the real SDK path)", async () => {
    // Regression: the handler previously called the nonexistent `resend.inbound.get`,
    // which threw on a real-shaped client and left the body unavailable. A client
    // exposing ONLY the correct path must yield the real body.
    const realShaped = fetcher({ data: { text: "real client reply", html: null }, error: null });
    expect(await fetchInboundBody(realShaped, "email_1")).toBe("real client reply");
  });

  it("trims whitespace from the text body", async () => {
    const body = await fetchInboundBody(fetcher({ data: { text: "  hello  \n" } }), "e");
    expect(body).toBe("hello");
  });

  it("falls back to stripped HTML when there is no text part", async () => {
    const body = await fetchInboundBody(
      fetcher({ data: { text: null, html: "<p>hi <b>there</b></p>" } }),
      "e",
    );
    expect(body).toBe("hi there");
  });

  it("returns the unavailable sentinel when Resend returns an error", async () => {
    const body = await fetchInboundBody(fetcher({ data: null, error: { message: "not found" } }), "e");
    expect(body).toBe(BODY_UNAVAILABLE);
  });

  it("returns the unavailable sentinel when the call throws (old broken path)", async () => {
    const broken: InboundEmailFetcher = {
      emails: {
        receiving: {
          get: async () => {
            throw new TypeError("Cannot read properties of undefined (reading 'get')");
          },
        },
      },
    };
    expect(await fetchInboundBody(broken, "e")).toBe(BODY_UNAVAILABLE);
  });
});

describe("htmlToText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToText("<div>a\n\n  <span>b</span></div>")).toBe("a b");
  });
});

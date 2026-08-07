"use client";

type TtqContent = {
  content_id: string;
  content_type: "product" | "product_group";
  content_name: string;
};

type TtqEventPayload = {
  contents?: TtqContent[];
  value?: number;
  currency?: string;
};

type Ttq = {
  page: () => void;
  track: (event: string, payload?: TtqEventPayload, opts?: { event_id?: string }) => void;
  identify: (props: { email?: string; phone_number?: string; external_id?: string }) => void;
};

const PRODUCT: TtqContent = {
  content_id: "f1-attractiveness-protocol",
  content_type: "product",
  content_name: "Attractiveness Protocol",
};

const PRODUCT_PRICE_USD = 89;

const DATING_PRODUCT: TtqContent = {
  content_id: "dating-ai-photos",
  content_type: "product",
  content_name: "Protocol Dating",
};

const DATING_PRICE_USD = 39;

function ttq(): Ttq | null {
  if (typeof window === "undefined") return null;
  const g = (window as Window & { ttq?: Ttq }).ttq;
  return g ?? null;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function tiktokIdentify(props: { email?: string; externalId?: string }) {
  const t = ttq();
  if (!t) return;
  try {
    const payload: { email?: string; external_id?: string } = {};
    if (props.email) payload.email = await sha256Hex(props.email);
    if (props.externalId) payload.external_id = await sha256Hex(props.externalId);
    if (Object.keys(payload).length === 0) return;
    t.identify(payload);
  } catch {
    // Hashing failures must never block downstream flows.
  }
}

export function tiktokTrackViewContent(pathname: string, title?: string) {
  const t = ttq();
  if (!t) return;
  try {
    t.track("ViewContent", {
      contents: [
        {
          content_id: pathname || "/",
          content_type: "product_group",
          content_name: title || pathname || "page",
        },
      ],
    });
  } catch {
    /* noop */
  }
}

// Fired on every /dating CTA click (higher-funnel intent signal than
// InitiateCheckout, which only fires once the Stripe session is created).
// event_id is shared with the server CAPI AddToCart for TikTok dedup.
export function tiktokTrackAddToCart(eventId?: string) {
  const t = ttq();
  if (!t) return;
  try {
    t.track(
      "AddToCart",
      {
        contents: [DATING_PRODUCT],
        value: DATING_PRICE_USD,
        currency: "USD",
      },
      eventId ? { event_id: eventId } : undefined,
    );
  } catch {
    /* noop */
  }
}

export function tiktokTrackInitiateCheckout(sessionId?: string) {
  const t = ttq();
  if (!t) return;
  try {
    t.track(
      "InitiateCheckout",
      {
        contents: [PRODUCT],
        value: PRODUCT_PRICE_USD,
        currency: "USD",
      },
      sessionId ? { event_id: sessionId } : undefined,
    );
  } catch {
    /* noop */
  }
}

export function tiktokTrackCompleteRegistration() {
  const t = ttq();
  if (!t) return;
  try {
    t.track("CompleteRegistration", {
      contents: [PRODUCT],
      value: PRODUCT_PRICE_USD,
      currency: "USD",
    });
  } catch {
    /* noop */
  }
}

export function tiktokTrackPurchase(sessionId?: string, value?: number) {
  const t = ttq();
  if (!t) return;
  try {
    t.track(
      "CompletePayment",
      {
        contents: [PRODUCT],
        value: value ?? PRODUCT_PRICE_USD,
        currency: "USD",
      },
      sessionId ? { event_id: sessionId } : undefined,
    );
  } catch {
    /* noop */
  }
}

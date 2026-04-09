const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";

type KlaviyoItem = {
  ProductID: string;
  ProductName: string;
  Quantity: number;
  ItemPrice: number;
  RowTotal: number;
  ProductURL: string;
};

type StartedCheckoutProps = {
  email: string;
  firstName?: string;
  value: number;
  checkoutUrl: string;
  items: KlaviyoItem[];
  utm?: Record<string, string | undefined>;
};

/**
 * Send a "Started Checkout" event to Klaviyo via the Events API (v2024-02-15).
 * Fires server-side only. Errors are non-fatal — logged but never thrown.
 */
export async function trackKlaviyoStartedCheckout(props: StartedCheckoutProps): Promise<void> {
  const apiKey = process.env.KLAVIYO_PRIVATE_KEY;
  if (!apiKey) {
    console.warn("[klaviyo] KLAVIYO_PRIVATE_KEY not set — skipping");
    return;
  }

  const body = {
    data: {
      type: "event",
      attributes: {
        properties: {
          $value: props.value,
          CheckoutURL: props.checkoutUrl,
          ItemNames: props.items.map((i) => i.ProductName),
          Items: props.items,
          ...(props.utm?.utm_source && { utm_source: props.utm.utm_source }),
          ...(props.utm?.utm_campaign && { utm_campaign: props.utm.utm_campaign }),
          ...(props.utm?.utm_content && { utm_content: props.utm.utm_content }),
          ...(props.utm?.utm_medium && { utm_medium: props.utm.utm_medium }),
          ...(props.utm?.fbclid && { fbclid: props.utm.fbclid }),
        },
        metric: {
          data: {
            type: "metric",
            attributes: { name: "Started Checkout" },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: props.email,
              ...(props.firstName && { first_name: props.firstName }),
            },
          },
        },
      },
    },
  };

  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[klaviyo] Started Checkout failed", { status: res.status, body: text, email: props.email });
    } else {
      console.log("[klaviyo] Started Checkout sent", { email: props.email });
    }
  } catch (err) {
    console.error("[klaviyo] Started Checkout error", { error: String(err), email: props.email });
  }
}

const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_LIST_ID = "UQbC9Z";

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

function getApiKey(): string | null {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key) {
    console.warn("[klaviyo] KLAVIYO_PRIVATE_KEY not set — skipping");
    return null;
  }
  return key;
}

/**
 * Create or update a Klaviyo profile and subscribe them to the main list.
 * Returns the Klaviyo profile ID on success, null on failure.
 */
async function upsertProfileAndSubscribe(
  apiKey: string,
  email: string,
  firstName?: string,
): Promise<string | null> {
  // Step 1: create/update profile
  const profileBody = {
    data: {
      type: "profile",
      attributes: {
        email,
        ...(firstName && { first_name: firstName }),
      },
    },
  };

  let profileId: string | null = null;
  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify(profileBody),
    });

    if (res.status === 201 || res.status === 200) {
      const json = (await res.json()) as { data?: { id?: string } };
      profileId = json.data?.id ?? null;
    } else if (res.status === 409) {
      // Profile already exists — extract ID from the conflict response
      const json = (await res.json()) as { errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
      profileId = json.errors?.[0]?.meta?.duplicate_profile_id ?? null;
    } else {
      const text = await res.text().catch(() => "");
      console.error("[klaviyo] profile upsert failed", { status: res.status, body: text, email });
      return null;
    }
  } catch (err) {
    console.error("[klaviyo] profile upsert error", { error: String(err), email });
    return null;
  }

  if (!profileId) {
    console.error("[klaviyo] no profile ID returned", { email });
    return null;
  }

  // Step 2: add profile to list
  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }],
      }),
    });

    if (res.ok || res.status === 204) {
      console.log("[klaviyo] profile added to list", { email, profileId, listId: KLAVIYO_LIST_ID });
    } else {
      const text = await res.text().catch(() => "");
      console.error("[klaviyo] list subscribe failed", { status: res.status, body: text, email });
    }
  } catch (err) {
    console.error("[klaviyo] list subscribe error", { error: String(err), email });
  }

  return profileId;
}

/**
 * Send a "Started Checkout" event to Klaviyo and add the profile to the list.
 * Fires server-side only. Errors are non-fatal — logged but never thrown.
 */
export async function trackKlaviyoStartedCheckout(props: StartedCheckoutProps): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  // Run profile upsert + list subscribe in parallel with the event
  const [, ] = await Promise.allSettled([
    upsertProfileAndSubscribe(apiKey, props.email, props.firstName),
    (async () => {
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
    })(),
  ]);
}

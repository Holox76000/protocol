"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../lib/ga4Event";

export default function CheckoutStatusEvent({
  eventName,
  funnel,
  sessionId,
}: {
  eventName: "payment_success" | "payment_failed";
  funnel: string;
  sessionId?: string;
}) {
  useEffect(() => {
    trackGa4Event(eventName, {
      funnel,
      transaction_id: sessionId,
    });

    if (eventName === "payment_success") {
      trackGa4Event("purchase", {
        transaction_id: sessionId,
        value: 19,
        currency: "USD",
        tax: 0,
        shipping: 0,
        funnel,
        items: [
          {
            item_id: "body-analysis-transformation-protocol",
            item_name: "Body Analysis + Body Transformation Protocol",
            price: 19,
            quantity: 1,
          },
        ],
      });
    }
  }, [eventName, funnel, sessionId]);

  return null;
}

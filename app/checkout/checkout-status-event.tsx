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
  }, [eventName, funnel, sessionId]);

  return null;
}

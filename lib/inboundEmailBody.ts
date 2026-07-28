// Fetch the text body of an inbound (received) email from Resend.
//
// The `email.received` webhook payload carries only metadata (from/to/subject),
// NOT the text/html body — so the handler must pull the full received email
// separately. In the Resend SDK (v6.x) that lives at
// `resend.emails.receiving.get(id)` (REST: GET /emails/receiving/{id}), which
// returns a `{ data, error }` envelope. An earlier version called the
// nonexistent `resend.inbound.get(id)`, which threw and left every Slack mirror
// showing "(message body unavailable)". This helper isolates the correct path
// so it can be unit-tested.

export const BODY_UNAVAILABLE = "(message body unavailable)";

// Minimal structural shape we depend on — a real `Resend` instance satisfies it.
export type InboundEmailFetcher = {
  emails: {
    receiving: {
      get: (id: string) => Promise<{
        data?: { text?: string | null; html?: string | null } | null;
        error?: { message?: string } | null;
      }>;
    };
  };
};

export function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchInboundBody(
  resend: InboundEmailFetcher,
  emailId: string,
): Promise<string> {
  try {
    const { data: email, error } = await resend.emails.receiving.get(emailId);
    if (error) {
      console.error("[inboundEmailBody] Resend returned an error", {
        error: error.message,
        emailId,
      });
    } else if (email?.text) {
      return email.text.trim();
    } else if (email?.html) {
      return htmlToText(email.html);
    }
  } catch (err) {
    console.error("[inboundEmailBody] Failed to fetch email body", {
      error: String(err),
      emailId,
    });
  }
  return BODY_UNAVAILABLE;
}

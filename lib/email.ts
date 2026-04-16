import { Resend } from "resend";

const FROM = "Protocol Club <hello@protocol-club.com>";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

// ─────────────────────────────────────────────────────────
// Welcome email — envoyé après achat pour créer son compte
// ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(props: {
  email: string;
  firstName?: string;
  registrationUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "toi";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Crée ton accès Protocol Club",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Bienvenue ${name} 👋
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Ton paiement est confirmé. Il ne te reste plus qu'à créer ton accès pour consulter ton protocole.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            Clique sur le bouton ci-dessous pour choisir ton mot de passe et accéder à ton espace.
          </p>
          <a href="${props.registrationUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            Créer mon accès →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Ce lien est valable 7 jours. Si tu as des questions, réponds directement à cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendWelcomeEmail failed: ${error.message}`);
  console.log("[resend] welcome email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Magic link — connexion sans mot de passe
// ─────────────────────────────────────────────────────────
export async function sendMagicLinkEmail(props: {
  email: string;
  firstName: string;
  magicLinkUrl: string;
}): Promise<void> {
  const resend = getResend();

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Ton lien de connexion Protocol Club",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Ton lien de connexion
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Salut ${props.firstName}, voici ton lien pour te connecter à ton espace Protocol Club.
          </p>
          <a href="${props.magicLinkUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            Me connecter →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Ce lien expire dans 20 minutes et ne peut être utilisé qu'une seule fois.<br>
            Si tu n'as pas demandé ce lien, ignore cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendMagicLinkEmail failed: ${error.message}`);
  console.log("[resend] magic link email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Protocol livré — notifie le client que son protocole est prêt
// ─────────────────────────────────────────────────────────
export async function sendProtocolDeliveredEmail(props: {
  email: string;
  firstName?: string;
  dashboardUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "toi";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Ton protocole est prêt 🎯",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Ton protocole est disponible ${name} 🎯
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Ton protocole personnalisé vient d'être finalisé. Il est maintenant accessible dans ton espace membre.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            Connecte-toi pour le consulter et commencer dès aujourd'hui.
          </p>
          <a href="${props.dashboardUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            Voir mon protocole →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Des questions ? Réponds directement à cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendProtocolDeliveredEmail failed: ${error.message}`);
  console.log("[resend] protocol delivered email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Confirmation d'achat — envoyé immédiatement après paiement
// ─────────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(props: {
  email: string;
  firstName?: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "toi";
  const formattedAmount = `${props.amount.toFixed(2)} ${props.currency}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Confirmation de ta commande Protocol Club",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Commande confirmée ✓
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#bbb;line-height:1.6;">
            Merci ${name}, ton paiement a bien été reçu.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin:0 0 28px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#888;">Produit</td>
                  <td align="right" style="font-size:14px;color:#888;">Total</td>
                </tr>
                <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #2a2a2a;"></td></tr>
                <tr>
                  <td style="padding-top:12px;font-size:15px;color:#fff;">Attractiveness Protocol</td>
                  <td align="right" style="padding-top:12px;font-size:15px;color:#fff;font-weight:600;">${formattedAmount}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:15px;color:#bbb;line-height:1.6;">
            On prépare ton protocole personnalisé. Tu recevras un email dès qu'il est prêt.
          </p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
            Des questions ? Réponds directement à cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendPurchaseConfirmationEmail failed: ${error.message}`);
  console.log("[resend] purchase confirmation email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Panier abandonné — email 1 (10 min) et email 2 (4h)
// Déclenché par le cron /api/cron/abandoned-cart
// ─────────────────────────────────────────────────────────
export async function sendAbandonedCartEmail(props: {
  email: string;
  firstName?: string;
  checkoutUrl: string;
  emailNumber: 1 | 2;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "toi";

  const isSecond = props.emailNumber === 2;

  const subject = isSecond
    ? "Dernière chance de démarrer ton protocole"
    : "Tu as oublié quelque chose 👀";

  const heading = isSecond
    ? `${name}, ton protocole t'attend toujours`
    : `Ton protocole t'attend ${name}`;

  const body = isSecond
    ? `Il y a quelques heures, tu as commencé ton questionnaire mais n'as pas finalisé ta commande. C'est ta dernière relance — après ça, on ne te dérange plus.`
    : `Tu as commencé à remplir ton questionnaire mais n'as pas finalisé ta commande. Ton protocole personnalisé est à un clic.`;

  const cta = isSecond ? "Je finalise maintenant →" : "Finaliser ma commande →";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            ${heading}
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            ${body}
          </p>
          <a href="${props.checkoutUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            ${cta}
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Des questions ? Réponds directement à cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[resend] sendAbandonedCartEmail failed", { error: error.message, email: props.email, emailNumber: props.emailNumber });
    return;
  }
  console.log("[resend] abandoned cart email sent", { email: props.email, emailNumber: props.emailNumber });
}

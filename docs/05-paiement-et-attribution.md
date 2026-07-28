<!-- category: Technique -->
<!-- summary: Les 3 modes de checkout Stripe, la logique de prix par funnel, et la chaîne d'attribution UTM → metadata → ad_id. -->

# Paiement & attribution

## Stripe — trois modes de checkout coexistent

Client serveur : `getStripeServerClient()` (`lib/stripe.ts`), version d'API
épinglée `2024-06-20`.

| Mode | Où | Comportement |
|---|---|---|
| **Hosted Checkout Session** | `create-checkout-session` (branche non-embedded) | `mode: payment`, collecte téléphone, codes promo, expiration 30 min avec recovery. `success_url` branche vers `/dating/success` ou `/checkout/success`. |
| **Embedded Checkout** | même route, `ui_mode: embedded` | Renvoie un `client_secret`, `return_url` → `/dashboard`. |
| **Payment Intent** | `create-payment-intent` | `paymentIntents.create` direct, **montant $89 en dur**, trouve/crée le customer par email. C'est le flow embarqué de `/f1`. |

### Logique de prix par funnel

`getCheckoutLineItems(funnel)` (`lib/stripe.ts`) :

| Funnel | Price ID (env) | Fallback inline |
|---|---|---|
| `f1` | `STRIPE_F1_PRICE_ID` | **$89** — « Attractiveness Protocol — 3-Month Program » |
| `dating` | `STRIPE_DATING_PRICE_ID` | **$39** — « Protocol Dating — AI Dating Photos » |
| `main` (défaut) | `STRIPE_PRICE_ID` | **$19** — « Body Analysis + Body Transformation Protocol » |

Funnels connus : `main, f2, v3, woman, f1, dating`. Un funnel inconnu tombe sur
`main`. Les upsells Dating utilisent toujours du `price_data` inline ($20),
jamais un Price ID.

> ⚠️ **Bug de prix connu** (`TODOS.md`, P1, non corrigé) :
> `app/checkout/hosted/page.tsx` a son propre `KNOWN_FUNNELS` qui **omet
> `"dating"`**, donc un lien `/checkout/hosted?funnel=dating` retombe
> silencieusement sur `main` et **facture $19 au lieu de $39**. La LP Dating
> utilise normalement une session Stripe directe, donc ça ne mord que si un lien
> Dating passe par `/checkout/hosted`.

## Le webhook Stripe

`app/api/webhooks/stripe/route.ts`, signature vérifiée avec
`STRIPE_WEBHOOK_SECRET`. C'est le point central de la conversion. Deux
événements :

**`payment_intent.succeeded`**
- Ping Slack `#sales` canonique pour **chaque** vente non-Dating.
- Le champ metadata `capi_purchase_source` désambiguïse le flow pour éviter le
  double-comptage (skip les PI détenus par une Checkout Session).
- Fire Meta CAPI + TikTok + GA4 `Purchase` (event_id = id du PI).
- Marque `users.has_paid`, met en pause le nurture, et pour un nouveau client
  crée un token d'inscription + email de bienvenue.

**`checkout.session.completed`**
- Branche **upsells Dating** (`upsell_kind` priority/luxury) : flip des flags sur
  `dating_orders`, ping Slack, return.
- **Garde « argent encaissé »** : pour Dating, si `payment_status !== "paid"`
  (les moyens de paiement async peuvent déclencher `completed` avant
  l'encaissement), le handler **ne enregistre rien, ne poste pas Slack,
  n'envoie pas d'email**. « Ne pas confirmer un paiement non-réglé. »
- Chemin Dating payé : upsert `dating_orders` (idempotent via
  `slack_sales_thread_ts`), racine du fil Slack, email de confirmation (awaité).

## La chaîne d'attribution

Comment une vente est reliée à la créa exacte qui l'a générée. **`utm_content`
= l'ad_id numérique Meta** : c'est la clé de jointure de bout en bout.

1. **Capture** — `lib/utm.ts` lit les clés UTM (`utm_source/medium/campaign/
   content/term/adset/ad`, `fbclid`, `ttclid`) depuis l'URL et les persiste en
   **sessionStorage** (`prtcl_utm`, stratégie de merge). `appendUtmToPath` les
   réattache aux liens internes.
2. **Session funnel** — `funnel-shell.tsx` écrit les UTM dans les réponses
   (`_utm_*`) et synchronise vers `funnel_sessions` en Supabase.
3. **Checkout** — le client passe les UTM + `ga_client_id` (du cookie `_ga`) +
   `funnel_sid` aux routes de création, qui les écrivent toutes dans la
   **metadata Stripe**. `create-payment-intent` a un **filet de sécurité** : si
   les UTM manquent, il les rebackfill depuis la ligne `funnel_sessions`
   (« 12/19 ventes historiques n'avaient pas d'UTM car la copie localStorage
   était perdue »).
4. **Purchase** — le webhook relit `utm_*`, `fbclid`, `ttclid`, `ga_client_id`
   depuis la metadata et les attache aux events CAPI/TikTok/GA4.
5. **Résolution de la créa** — `utm_content` = ad_id Meta → match d'une vente
   Stripe à une pub précise (`payment.metadata.utm_content`).

Cette metadata stashée sert aussi à **remonter l'EMQ** (qualité de matching des
events serveur) — voir *Marketing → Tracking*.

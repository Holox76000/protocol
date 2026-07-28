<!-- category: Technique -->
<!-- summary: Les 3 modes de checkout Stripe, la logique de prix par funnel, et la chaîne d'attribution UTM → metadata → ad_id. -->

# Paiement & attribution

## Stripe — trois modes de checkout coexistent

Client serveur : `getStripeServerClient()` (`lib/stripe.ts`), version d'API
épinglée `2024-06-20`.

Le flow live est le **Hosted Checkout Session** (`create-checkout-session`,
`mode: payment`) : collecte téléphone, codes promo, expiration 30 min avec
recovery, `success_url` → `/dating/success`. (La route sait aussi rendre un
**Embedded Checkout** — `ui_mode: embedded`, renvoie un `client_secret`.)

### Le prix

`getCheckoutLineItems("dating")` (`lib/stripe.ts`) résout le funnel `dating` vers
`STRIPE_DATING_PRICE_ID`, fallback inline **$39** (« Protocol Dating — AI Dating
Photos »). Les **upsells** utilisent toujours du `price_data` inline ($20),
jamais un Price ID.

> Le repo porte d'autres funnels de prix hérités du Protocol arrêté (`f1` $89,
> `main` $19…) — voir *Précédentes itérations*.

> ⚠️ **Bug de prix connu** (`TODOS.md`, P1, non corrigé) :
> `app/checkout/hosted/page.tsx` a son propre `KNOWN_FUNNELS` qui **omet
> `"dating"`**, donc un lien `/checkout/hosted?funnel=dating` retombe
> silencieusement sur `main` et **facture $19 au lieu de $39**. La LP Dating
> utilise normalement une session Stripe directe, donc ça ne mord que si un lien
> Dating passe par `/checkout/hosted`.

> ⚠️ **Bug de prix connu** (`TODOS.md`, P1, non corrigé) :
> `app/checkout/hosted/page.tsx` a son propre `KNOWN_FUNNELS` qui **omet
> `"dating"`**, donc un lien `/checkout/hosted?funnel=dating` retombe
> silencieusement sur `main` et **facture $19 au lieu de $39**. La LP Dating
> utilise normalement une session Stripe directe, donc ça ne mord que si un lien
> Dating passe par `/checkout/hosted`.

## Le webhook Stripe

`app/api/webhooks/stripe/route.ts`, signature vérifiée avec
`STRIPE_WEBHOOK_SECRET`. C'est le point central de la conversion. L'événement
live est **`checkout.session.completed`** (le handler `payment_intent.succeeded`
existe encore mais servait l'ancien flow Protocol — voir *Précédentes
itérations*).

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
2. **Session funnel** — la session écrit les UTM dans les réponses (`_utm_*`) et
   synchronise vers `funnel_sessions` en Supabase (mécanisme partagé, toujours
   utilisé côté Dating).
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

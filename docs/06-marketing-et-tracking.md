<!-- category: Marketing -->
<!-- summary: Le tracking multi-canal (Meta/TikTok/GA4), la déduplication, l'EMQ, la matrice d'événements, la personnalisation par IA et l'email marketing. -->

# Marketing & tracking

Le tracking est le nerf de la guerre : c'est une machine d'acquisition payante,
et la qualité du signal renvoyé aux plateformes détermine l'efficacité de
l'optimisation des pubs. D'où un dispositif quasi militaire.

## Trois canaux, chacun en deux moitiés

Chaque canal a un **pixel navigateur** et une **API serveur**, dédupliqués par
un `event_id` partagé.

| Canal | Navigateur (pixel) | Serveur (API) | Lib serveur |
|---|---|---|---|
| **Meta** | `fbq(...)` | Conversions API (CAPI) → Graph API | `lib/metaCapi.ts` |
| **TikTok** | `ttq(...)` | Events API v1.3 | `lib/tiktokEventsApi.ts` |
| **GA4** | `gtag` / cookie `_ga` | Measurement Protocol | `lib/ga4.ts` |

- **Meta CAPI** : hash SHA-256 de l'email, passe UA + IP, construit `fbc` depuis
  `fbclid`. Envoie `event_id` pour la dedup.
- **TikTok Events API** : hash email + téléphone E.164 + `external_id`, passe
  `ttclid`, `ttp`. Gère le quirk TikTok (HTTP 200 avec un `code` non-zéro = échec).
- **GA4 MP** : parse le cookie `_ga` pour le `client_id`, envoie `purchase` avec
  `transaction_id`, `value`, `items`. Ne tourne qu'en production.

## Le bus d'événements côté client

`lib/analytics.ts` — `trackEvent(name, payload)` : génère/lit un session id
localStorage (`sf_quiz_session_id`), construit `eventId = "{sessionId}:{name}:{ts}"`,
fire l'event pixel Meta correspondant, et POST vers `/api/track`. Ne tourne
qu'en production.

`app/ga4-route-tracker.tsx` — tracker de route SPA : à chaque changement de
route, persiste les UTM, beacon `page_view` GA4, fire Meta `PageView` et TikTok
`ViewContent`. Patche `history.pushState/replaceState` pour détecter les
navigations client. Skip `/admin`.

## La déduplication

La dedup repose sur **même `event_name` + même `event_id`** entre navigateur et
serveur :

| Event | `event_id` utilisé |
|---|---|
| InitiateCheckout | id de la Session Stripe (hosted) ou du PaymentIntent (embedded) |
| **Purchase** | id du PaymentIntent (canonique sur tous les chemins de fire) |
| ViewContent | `{sessionId}:view_offer:{ts}` |

## Matrice d'événements (event × canal × valeur)

| Event funnel | Meta | TikTok | GA4 | Valeur |
|---|---|---|---|---|
| PageView / route | `PageView` | `ViewContent` | `page_view` | — |
| `quiz_started` | `StartQuiz` (CAPI) | — | — | — |
| `view_offer` (F1) | `ViewContent` (px+CAPI) | `ViewContent` | — | **$89** |
| `view_offer` (dating) | `ViewContent` | `ViewContent` | — | **$39** |
| Lead (`/api/lead`) | `Lead` (CAPI) | `CompleteRegistration` | — | $89 |
| `cta_clicked` | custom « Vue de page de paiement » | — | — | — |
| InitiateCheckout | pixel + CAPI | pixel + Events API | `checkout_started` | $89 / $39 |
| **Purchase** | `Purchase` CAPI | `Purchase` Events API | `purchase` MP | **`amount_total` Stripe réel** |

> ⚠️ **À savoir** : les valeurs pixel navigateur sont **codées en dur** à $89
> (F1) ou $39 (dating), quel que soit le prix réel. Seul le Purchase serveur
> utilise le vrai `amount_total` Stripe. Sur le funnel `main` à $19, les valeurs
> du pixel navigateur sont donc nominales, pas réelles.

## EMQ (Event Match Quality)

L'EMQ est le score Meta 0–10 de correspondance entre un event serveur et un
utilisateur Meta. Plus l'EMQ est haut, meilleure est l'attribution et
l'optimisation. Le code **travaille activement** pour le maximiser :

- Le webhook Stripe est serveur-à-serveur et ne voit pas les headers du
  navigateur. Donc à la création du PI/session, on **stashe UA / IP / `_ttp` dans
  la metadata Stripe** (`customer_user_agent`, `customer_ip`, `customer_ttp`),
  puis on les relit au moment du Purchase pour les attacher — « to lift Purchase
  EMQ ».
- Plus email + téléphone (collecté par Stripe) → un max de clés de matching.
- ⚠️ Gap connu (`TODOS.md`) : les Purchase Dating sont **CAPI-only** (pas de
  pixel Purchase navigateur sur la success page Dating, contrairement à F1) →
  EMQ plus bas exactement sur la campagne dont l'optimisation dépend de la
  qualité du signal Purchase.

## Personnalisation par IA

Deux mécanismes de personnalisation de la copy (voir aussi *Parcours & funnels*) :

1. **Maps statiques ad_id → copy** (`lib/ad-variants.ts`, `lib/datingAdVariants.ts`)
   — congruence pub ↔ landing.
2. **Génération LLM** (`lib/personalization.ts`) — **Claude Sonnet** avec
   `tool_use` forcé (JSON strict) génère la copy hero LP + choix de testimonial
   à partir des réponses en texte libre du quiz. `validatePayload` **rejette** le
   « AI slop » (mots bannis, em-dashes, mauvaise longueur, phrases d'ouverture
   imposées). Caché dans `funnel_sessions.answers._personalization` ; le cache
   est *warmé* à la soumission du lead. Un détecteur de persona rule-based
   (`lib/personalizationPrompt.ts`) route vers 6 personas.

> Note : `lib/promptAnalyzer.ts` utilise **Gemini** (pas Anthropic) pour raffiner
> les prompts d'images du produit Dating — usage IA distinct.

## Preuve sociale

- **`lib/testimonials.ts`** — 7 témoignages keyés par persona ; la personnalisation
  Claude en choisit un.
- **`lib/studies.ts`** — bibliothèque de citations d'études peer-reviewed injectées
  dans les prompts de génération de rapport (crédibilité), avec instruction de
  citer `[Auteur, Année]` et de ne jamais fabriquer.

## Email marketing

- **`lib/klaviyo.ts`** — profils, listes, events (« Started Checkout », Purchase),
  welcome, magic link, promotion lead→customer (appelée depuis le webhook).
- **`lib/email.ts`** (Resend) — transactionnel (bienvenue, confirmation, magic
  link, livraison Dating) **et** la séquence de **nurture E2→E7**
  (Wedge/Insight/Mirror/Stakes/Projection/Breakup), avec footer marketing +
  désinscription un-clic (RFC 8058). L'E7 « breakup » part de l'adresse fondateur.
- **`lib/sendWindow.ts`** — ancre la séquence à **14:00 UTC** (pic d'inbox
  10am ET). Tous les steps partagent l'ancre.
- Orchestration : crons `lead-nurture` (E2→E7) et `abandoned-cart` (E1/E2). Un
  achat **met en pause** le nurture (`leads.nurture_paused_at`). Détail des crons
  dans *Operations → Slack & notifications*.

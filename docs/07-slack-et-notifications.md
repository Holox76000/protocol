<!-- category: Operations -->
<!-- summary: Tout ce qui part vers Slack et en revient, le système NPS, les emails inbound, et le catalogue des crons/webhooks. -->

# Slack, notifications & jobs

Slack est la **salle de contrôle opérationnelle** de la boîte : les ventes, les
nouvelles créas, le P&L quotidien, les emails clients et les réponses NPS y
arrivent en temps réel, et on peut **répondre aux clients directement depuis
Slack**.

## Deux transports Slack

Définis dans `lib/slack.ts` :

1. **Incoming webhooks** (`postToSlack(channel, payload)`) — fire-and-forget,
   mappe un nom de canal logique vers une variable `SLACK_WEBHOOK_*`. Utilisé
   pour les ventes, alertes pub, rapport quotidien, digest ops, emails inbound,
   NPS.
2. **Web API via bot token** (`slackPostMessage` / `slackUpdateMessage`) —
   utilisé **exclusivement** pour le « sales feed » Dating : un message racine
   par commande, édité et threadé au fil des états.

> Tous les appels Slack sont best-effort et **ne throw jamais** — une panne
> Slack ne peut pas casser un webhook Stripe, un cron, ou un flow utilisateur.

### Canaux

| Canal logique | Env | Canal Slack | Usage |
|---|---|---|---|
| `sales` | `SLACK_WEBHOOK_SALES` | #new-sales | Pings de nouvelles ventes |
| `ads` | `SLACK_WEBHOOK_ADS` | #ads-meta | Nouvelles créas Meta |
| `report` | `SLACK_WEBHOOK_REPORT` | #daily-report | P&L nocturne |
| `ops` | `SLACK_WEBHOOK_OPS` | #ops | Digest ops Dating quotidien |
| `emails` | `SLACK_WEBHOOK_EMAILS` | #emails | Chaque email client entrant |
| `survey` | `SLACK_WEBHOOK_SURVEY` | #survey | Réponses NPS |
| `funnel` | `SLACK_WEBHOOK_FUNNEL` | #funnel-changes | Déclaré mais **aucun appel actif** dans le code |

## Catalogue des notifications (app → Slack)

| Event | Canal | Déclencheur |
|---|---|---|
| **Nouvelle vente** (PI non-Dating réussi) | `sales` | webhook Stripe `payment_intent.succeeded` |
| **Commande Dating créée** (racine du fil) | `sales` (bot) | `checkout.session.completed` Dating payé |
| Dating : photos uploadées (édite racine 📸 + thread) | `sales` (bot) | route `complete-upload` |
| Dating : généré (édite racine ⏳ + coût/marge) | `sales` (bot) | `generateForOrder` |
| Dating : livré (édite racine ✅) | `sales` (bot) | `releaseOrder` |
| Upsell Dating acheté (priority/luxury $20) | `sales` | `checkout.session.completed` |
| **Nouvelle créa Meta détectée** | `ads` | cron `meta-ads-check` |
| **P&L quotidien** (spend Meta, ventes Stripe, ROAS vs breakeven 1.2×, funnel) | `report` | cron `daily-report` |
| **Digest ops Dating** (compte par statut, marge, warnings stuck/overdue) | `ops` | cron `dating-daily-ops` |
| **Email entrant** (chaque inbound Resend) | `emails` | webhook `resend-inbound` |
| **Réponse NPS Dating** | `survey` | route `nps/dating/submit` |

> Note : le NPS **Protocol** (non-Dating) écrit en base mais **ne poste pas**
> sur Slack. Seul le NPS **Dating** atteint #survey.

## Slack → app : répondre aux clients depuis Slack

C'est la seule surface entrante depuis Slack (`app/api/webhooks/slack-events/route.ts`).
Le round-trip :

1. Un email client arrive → notification dans **#emails** (qui **embarque le
   `resend id`** dans le message).
2. Un admin tape `!send <texte>` **dans le thread** de cette notification.
3. Slack envoie l'event → le handler vérifie la **signature HMAC**
   (`lib/slackSignature.ts`, comparaison à temps constant, fenêtre anti-replay
   5 min), extrait le `resend id` de la racine du thread, récupère l'email
   original, et envoie la **réponse via Resend** avec les headers `In-Reply-To` /
   `References` (donc ça thread proprement dans la boîte mail du client).
4. Réaction ✅ + message de confirmation dans le thread.

Pas de slash commands ni de boutons interactifs — juste `!send`.

## NPS

Envoi planifié par `netlify/functions/nps-survey.mts` (`*/5 * * * *`), 5 passes.
Les emails internes/équipe sont filtrés partout.

| Passe | Sondage | Timing | Route |
|---|---|---|---|
| 1 | NPS Protocol initial | 2h après `protocol_viewed_at` | `/nps/{token}` |
| 2 | Re-sondage J+30 | répondants initiaux, 30j après livraison | `/nps/{token}` |
| 3 | Relances J+1/J+2/J+3 | non-répondants | `/nps/{token}` |
| 4 | **NPS Dating** | 1h après `gallery_first_viewed_at` | `/nps/dating/{token}` |
| 5 | Relance Dating J+1 | non-répondants | `/nps/dating/{token}` |

## Emails (Resend)

Adresses : `hello@`, `expert@`, `Pierre <hello@…>`. Template partagé
`emailShell()`. Voir le tableau des senders transactionnels/lifecycle dans le
code (`lib/email.ts`). L'inbound (`resend-inbound`) : vérifie la signature svix,
parse l'adresse `reply+{userId}@` pour retrouver l'utilisateur, insère dans
`client_messages`, forward vers l'admin, et notifie #emails.

## Crons & jobs planifiés

Deux mécanismes : **fonctions planifiées Netlify** (`netlify/functions/*.mts`,
`schedule(...)`) — certaines contiennent la logique, d'autres sont de simples
wrappers qui `fetch` une route `/api/cron/*` avec `Bearer CRON_SECRET`.

| Schedule (UTC) | Fonction | Rôle | Slack |
|---|---|---|---|
| `0 20 * * *` | `daily-report` | Spend Meta + ventes Stripe → ROAS / P&L | #daily-report |
| `*/15 * * * *` | `meta-ads-check` | Détecte les nouvelles créas Meta (diff vs `meta_ads_seen`) | #ads-meta |
| `*/30 * * * *` | `lead-nurture` | Séquence nurture E2→E7 | — |
| `*/5 * * * *` | `abandoned-cart` | Recovery panier E1/E2 | — |
| `15 * * * *` | `delivery-reminder` | 24h non-livré → email admin | — |
| `*/5 * * * *` | `nps-survey` | Envoi NPS (5 passes) | — |
| `0 13 * * *` | `promo-blast` | Promo one-shot (gardée par un flag) | — |
| `*/30 * * * *` | `recover-meta-purchases` | Replay / recovery des events Purchase Meta | — |

> `dating-generate` et `dating-daily-ops` sont des routes `Bearer CRON_SECRET`
> **sans wrapper Netlify** — pilotées par un scheduler externe. `dating-generate`
> auto-release les commandes dont le `deliver_at` est passé, et génère une
> commande en attente par tick (claim CAS contre le double-traitement).

## Webhooks (récap)

- **Stripe** (`webhooks/stripe`) — le cœur de la conversion (voir *Paiement &
  attribution*).
- **Resend inbound** (`webhooks/resend-inbound`) — emails entrants → #emails.
- **Slack events** (`webhooks/slack-events`) — le `!send` de réponse client.

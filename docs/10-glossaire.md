<!-- category: Getting started -->
<!-- summary: Glossaire des termes maison et liste des problèmes connus à avoir en tête. -->

# Glossaire & problèmes connus

## Glossaire

| Terme | Définition |
|---|---|
| **Protocol Dating** | Le produit live : photos de dating générées par IA. $39 + 2 upsells $20. |
| **Funnel** | Un parcours de conversion. Le funnel live = `dating` (`getCheckoutLineItems`). |
| **CAPI** | Conversions API — l'envoi **serveur** des events de conversion à Meta (vs le pixel navigateur). |
| **Events API** | L'équivalent TikTok de CAPI. |
| **MP** | Measurement Protocol — l'équivalent GA4 (envoi serveur). |
| **EMQ** | Event Match Quality — score Meta 0–10 de qualité de matching d'un event serveur. Plus haut = meilleure optimisation. |
| **Dedup / event_id** | Le même event est envoyé pixel + serveur ; un `event_id` partagé évite le double-comptage. |
| **`utm_content`** | Porte l'**ad_id numérique Meta** — la clé de jointure vente ↔ créa. |
| **Attribution** | La chaîne UTM → metadata Stripe → Purchase qui relie une vente à la pub exacte. |
| **ROAS** | Return On Ad Spend. Le rapport quotidien compare au breakeven ~1.2×. |
| **CPL** | Cost Per Lead. |
| **LPV** | Landing Page View (event pub). |
| **Nurture** | La séquence email E2→E7 qui relance les leads non-acheteurs (copy écrite pour Protocol, à revoir pour Dating). |
| **Nano Banana** | Le modèle d'image Gemini utilisé pour générer les photos Dating (`lib/nanoBanana.ts`). |
| **Template** (Dating) | Une scène cible pour la génération (`dating_templates`). 1 template actif = 1 photo. `kind` = `core` ou `luxury`. |
| **Sales feed** | Le fil Slack threadé d'une commande Dating, édité à chaque transition d'état. |
| **MCP** | Model Context Protocol — le serveur qui expose la donnée business à Claude (`mcp/`, `app/api/mcp`). |
| **gstack** | La bibliothèque de playbooks IA de la boîte (`.agents/skills/`). |
| **Playbook / skill** | Un workflow codifié (office-hours, ship, qa, review…) que l'IA exécute. |
| **CC** | « Claude Code » — dans `TODOS.md`, une estimation d'effort en temps IA. |
| **RLS** | Row-Level Security Postgres, utilisée ici comme verrou deny-by-default. |

## Problèmes connus (à avoir en tête)

Extraits de `TODOS.md` et des incohérences relevées dans le code. **Lire
`TODOS.md` pour la liste à jour et priorisée.** Ne concernent que le produit
**live (Dating)** — les incohérences de l'ancien Protocol sont archivées dans
*Précédentes itérations*.

- **Bug hosted-checkout Dating (P1)** — `app/checkout/hosted/page.tsx` omet
  `"dating"` de son `KNOWN_FUNNELS`, donc un lien
  `/checkout/hosted?funnel=dating` **facture $19 au lieu de $39**.
- **EMQ Dating plus bas** — les Purchase Dating sont CAPI-only (pas de pixel
  Purchase navigateur sur la success page), ce qui abaisse la qualité de signal
  sur la campagne Dating.
- **Valeurs pixel navigateur en dur** ($39) quel que soit le prix réel ; seul le
  Purchase serveur utilise le montant Stripe réel.
- **« 30 photos » est de la copy**, pas une constante — le nombre réel = les
  `dating_templates` actifs.
- **Incohérence de nom de modèle** — les commentaires disent « Nano Banana Pro /
  gemini-3-pro-image-preview » mais le client par défaut sur `gemini-3.1-flash-image`.
- **Session id = bearer token fuité vers l'analytics (P1)** — le `cs_live_…`
  dans l'URL `/dating/success` donne des droits de lecture/upload et est
  auto-capturé par les pixels GA4/Meta. Mitigation proposée dans `TODOS.md`.
- **Code legacy à ne pas toucher** : tout le stack Protocol (funnels, quiz,
  scoring, rapport, PDF). Inventaire complet dans *Précédentes itérations*.

## Où trouver quoi (aide-mémoire)

| Je cherche… | Fichier(s) |
|---|---|
| La logique de prix / checkout | `lib/stripe.ts`, `app/api/create-*` |
| Le tracking pub | `lib/metaCapi.ts`, `lib/tiktokEventsApi.ts`, `lib/ga4.ts`, `lib/analytics.ts` |
| La génération Dating | `lib/datingGeneration.ts`, `lib/nanoBanana.ts`, `lib/datingTemplates.ts` |
| Les notifs Slack | `lib/slack.ts`, `lib/datingSlackFeed.ts` |
| Les emails | `lib/email.ts`, `lib/klaviyo.ts` |
| Le webhook de conversion | `app/api/webhooks/stripe/route.ts` |
| Les crons | `netlify/functions/*.mts`, `app/api/cron/*` |
| Le serveur de données IA | `mcp/server.mjs`, `app/api/mcp/route.ts` |
| Les playbooks IA | `.agents/skills/`, routing dans `CLAUDE.md` |
| Le schéma de base | `supabase/migrations/*.sql` |

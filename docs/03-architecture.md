<!-- category: Technique -->
<!-- summary: Stack, déploiement, structure du repo, modèle de données Supabase et authentification. -->

# Architecture

## Stack

| Couche | Choix |
|---|---|
| Framework | **Next.js 14.2.5** — App Router (`app/`) + une échappatoire Pages Router (`pages/api/admin/export-pdf.ts` pour le PDF) |
| Langage | TypeScript 5.5 (`strict`), React 18.3 |
| Styling | Tailwind 3.4 + PostCSS. Tokens de design dans `tailwind.config.ts` (`void`, `pebble`, `wire`, `ink`, `dim`…) |
| Base de données | **Supabase** (Postgres + Storage), SDK JS 2.45 |
| Paiement | **Stripe** 16.8 (SDK serveur + `@stripe/react-stripe-js`) |
| Email | **Resend** 6.12 (transactionnel + marketing + inbound) |
| Pub / analytics | Meta (Pixel + Conversions API), TikTok (Pixel + Events API), GA4 (Measurement Protocol) |
| IA | `@anthropic-ai/sdk` (personnalisation copy) · Gemini « Nano Banana » (génération d'images) |
| PDF | `@react-pdf/renderer` (rendu depuis le Pages Router pour éviter la couche RSC) |
| Images | `sharp` + `heic-convert` (normalisation des selfies) |
| MCP | `@modelcontextprotocol/sdk` — le serveur de données (voir *Opérer avec l'IA*) |
| Tests | **Vitest** (`lib/*.test.ts`) |
| Hébergement | **Netlify** via `@netlify/plugin-nextjs` ; build `npm run build` |

## Structure du repo

```
app/            Routes Next.js (App Router) — funnels, checkout, admin, api/*
components/     Composants React partagés (landing/, quiz…)
lib/            Toute la logique métier (scoring, stripe, tracking, email, slack, auth…)
mcp/            Le serveur de données MCP (server.mjs, proxy.mjs)
supabase/       Migrations SQL (001…032)
netlify/        Fonctions planifiées (crons) .mts
pages/          Échappatoire Pages Router (export PDF)
scripts/        Scripts one-off (backfills, réconciliations)
docs/           ← ce manuel
.agents/        Bibliothèque de skills gstack (playbooks IA)
.claude/        Config Claude Code (hooks, settings)
CLAUDE.md       Conventions de dev pour l'IA
AGENTS.md       Conventions pour l'hôte Codex
CHANGELOG.md    Journal des releases · VERSION · TODOS.md (backlog des reviews)
```

## Déploiement

- **Netlify** construit et sert l'app. `netlify.toml` enregistre le plugin
  Next.js. Les crons sont des **fonctions planifiées Netlify** (`netlify/functions/*.mts`).
- Domaine de prod : `protocol-club.com`.
- Le déploiement se fait via le playbook **`ship`** (voir *Opérer avec l'IA*),
  pas à la main.

## Authentification

Sessions par cookie, deux niveaux. Le cookie s'appelle `prtcl_session`.

- **Utilisateur** (`lib/auth.ts`) : mots de passe hashés bcrypt (10 rounds).
  Un token de 32 octets est généré, son **hash sha256** stocké dans la table
  `sessions`, le token brut posé en cookie httpOnly. TTL 30 jours. Rate-limiting
  en mémoire (login 5/IP/min). Login passwordless possible (magic link, 20 min).
  La route login fait un **compare bcrypt factice** quand l'user n'existe pas
  pour éviter l'énumération par timing.
- **Admin** (`lib/adminAuth.ts`) : `requireAdmin()` valide la session **et**
  exige `user.is_admin`. Pas de système de credentials admin séparé — c'est un
  booléen sur `users`.
- **`middleware.ts`** (Edge) : gate les préfixes `/dashboard`, `/questionnaire`,
  `/admin`, `/protocol`. Il ne vérifie que la **présence** du cookie (pas de
  requête DB en edge) ; la validation complète se fait dans la page/route.
- **Ce manuel `/docs`** est gated côté serveur sur `is_admin` (via
  `requireAdmin()` dans son layout) et jamais indexé.
- **MCP** a sa propre auth : OAuth 2.0 + PKCE **ou** un bearer statique
  (`MCP_SECRET`). Voir *Opérer avec l'IA*.

## Modèle de données (Supabase Postgres)

Migrations dans `supabase/migrations/001…032`. Les **tables de base**
(`users`, `leads`, `sessions`, `protocols`, `questionnaire_responses`,
`event_sessions`, tables de tokens) préexistent au suivi des migrations — les
fichiers `.sql` ne font que les *étendre*.

| Table | Rôle | Colonnes clés |
|---|---|---|
| **leads** | Opt-ins du quiz (haut de funnel), 1 ligne/email | `email`, `payload` JSONB (answers, utm, funnel_sid), colonnes nurture `nurture_e2…e7_sent_at`, `nurture_paused_at`, `nurture_starts_at` |
| **funnel_sessions** | État complet d'une session de quiz — **source de vérité pour l'attribution** | `session_id`, `answers` JSONB (réponses + `_utm_*`, `_fbclid`, `_ttclid`) |
| **event_sessions** | Log d'événements de funnel au niveau step | `session_id`, `event`, `step`, `payload` |
| **users** | Clients payants / comptes | `email`, `password_hash`, `is_admin`, `has_paid`, `paid_amount_cents`, `paid_at`, `protocol_status`, `stripe_customer_id`… |
| **protocols** | Contenu du protocole généré par user | sections, `before_url`/`after_url`, `before_after_analysis` |
| **questionnaire_responses** | Questionnaire d'onboarding post-achat | (spec dans `protocol-questionnaire-spec.md`) |
| **sessions** | Sessions d'auth serveur | `user_id`, `token_hash`, `expires_at` |
| **registration_tokens** / **magic_link_tokens** / **cart_recovery_tokens** / **unsubscribe_tokens** | Tokens à usage unique / TTL variés | `token_hash`, `expires_at`, `used` |
| **email_suppressions** / **email_events** | Do-not-send + log append-only Resend | — |
| **client_messages** | Messages bidirectionnels client↔admin | `user_id`, `direction` (inbound/outbound), `resend_email_id` |
| **visualization_previews** | Previews before/after IA | `before_path`, `after_path`, `analysis_text` |
| **meta_ads_seen** | Dedup pour le cron de détection de nouvelles créas Meta | `ad_id` PK, `effective_status`… |
| **dating_orders** | Cycle de vie des commandes Dating (le state machine le plus riche) | voir *Produit* ; `status`, `photo_paths`, `output_paths`, `generation_cost_cents`, `deliver_at`, `slack_sales_thread_ts`, `upsell_priority/luxury`, bloc NPS |
| **dating_templates** | Templates de scènes pour la génération | `slug`, `label`, `prompt`, `ref_image_path`, `active`, `kind` (core/luxury) |

### Row-Level Security (RLS)

La RLS est utilisée comme **verrou deny-by-default**, pas pour des politiques
par-utilisateur : le code serveur utilise la clé service-role (qui bypass la
RLS), donc activer la RLS sans policy bloque tout accès anon/PostgREST.
`dating_orders` : RLS activée, 0 policy. `dating_templates` : RLS + une policy
service-role uniquement. `client_messages` : RLS explicitement désactivée.

## Storage

- **État du quiz côté client** : localStorage (`sf_quiz_state`), pas Supabase.
- **Selfies Dating** : bucket privé `dating-photos`, uploadés **directement**
  par le navigateur via URLs signées (les fonctions Netlify plafonnent les
  bodies ~6 Mo, donc les fichiers ne transitent pas par l'API). Normalisation
  serveur : HEIC→JPEG, rotation EXIF « cuite » dans les pixels via `sharp`.

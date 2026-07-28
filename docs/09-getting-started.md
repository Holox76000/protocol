<!-- category: Getting started -->
<!-- summary: Setup local, variables d'environnement par service, première contribution, et comment maintenir ce manuel. -->

# Getting started

Pour un nouveau dev qui veut faire tourner l'app en local et contribuer.

## Lancer en local

```bash
npm install          # (postinstall applique patch-package)
npm run dev          # Next.js dev sur http://localhost:3000
npm run build        # build de prod
npm run lint         # eslint
npx vitest           # tests unitaires (lib/*.test.ts)
```

Crée un `.env` (ou `.env.local`) avec au minimum les clés Supabase et Stripe.
Routes utiles en local :

- Dating (produit live) : `http://localhost:3000/dating`
- Admin : `http://localhost:3000/admin` (nécessite un user `is_admin`)
- **Ce manuel** : `http://localhost:3000/docs` (nécessite un user `is_admin`)
- Anciennes routes Protocol (mortes) : `/`, `/funnel`, `/f1/*` — voir *Précédentes itérations*

## Variables d'environnement par service

Set complet, groupé. (Ne jamais committer de clé — Netlify les gère en prod.)

**Supabase** : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
**Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `STRIPE_F1_PRICE_ID`, `STRIPE_DATING_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
**Meta** : `META_ACCESS_TOKEN` (CAPI), `META_ADS_READ_TOKEN` (insights), `META_AD_ACCOUNT_ID`, `META_PIXEL_ID`, `META_TEST_EVENT_CODE`
**TikTok** : `TIKTOK_ACCESS_TOKEN`, `TIKTOK_PIXEL_ID`, `TIKTOK_TEST_EVENT_CODE`
**GA4** : `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`
**Email (Resend)** : `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_EVENTS_WEBHOOK_SECRET`, `RESEND_INBOUND_DOMAIN`, `ADMIN_NOTIFICATION_EMAIL`
**Slack** : `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_SALES_CHANNEL_ID`, `SLACK_OPS_CHANNEL_ID`, `SLACK_EMAILS_CHANNEL_ID`, + webhooks `SLACK_WEBHOOK_{SALES,OPS,ADS,EMAILS,FUNNEL,REPORT,SURVEY}`
**IA / images** : `NANOBANANA_API_KEY` (+ `NANO_BANANA_API_KEY`, `GEMINI_API_KEY`), `NANOBANANA_MODEL`, `NANOBANANA_AI_PROMPT_REFINE`. *(Note : pas de `ANTHROPIC_API_KEY` référencé via `process.env` dans le code app malgré la dépendance SDK — la personnalisation Claude passe par la config d'exécution.)*
**Klaviyo** : `KLAVIYO_PRIVATE_KEY`
**MCP** : `MCP_SECRET`, `MCP_LOGIN`, `MCP_PASSWORD`, `PROTOCOL_KEY`, `GITHUB_TOKEN`
**Cron / infra** : `CRON_SECRET`, `BG_FN_SECRET`, `PREGENERATE_SECRET`, `SITE_URL` / `NEXT_PUBLIC_SITE_URL`, etc.

## Conventions de code

- TypeScript strict. Toute la logique métier vit dans `lib/` ; les routes dans
  `app/`. Match le style du code environnant.
- **Après chaque edit frontend** (`.tsx`/`.css`), vérifie le rendu via le
  screenshot auto (`/tmp/latest-render.png`) — c'est une règle de `CLAUDE.md`.
- Écris des tests Vitest pour la logique pure (voir `lib/*.test.ts` : stripe,
  email, dating orders…).
- Tiens `CHANGELOG.md` + `VERSION` à jour à chaque release (playbook
  `document-release`).
- **Lis `TODOS.md` avant de démarrer** — il liste les problèmes connus et les
  dettes.

## Première contribution : la boucle

1. `office-hours` pour valider l'idée si c'est une feature produit.
2. Développe sur une branche.
3. `review` (code review) + `qa` (test du site).
4. `ship` pour déployer.
5. `document-release` pour mettre à jour la doc.

## Maintenir ce manuel

Ce wiki est **docs-as-code** — il se régénère à chaque déploiement.

- **Ajouter une page** : crée un fichier `docs/NN-slug.md`. Il apparaît
  automatiquement dans la sidebar et à `/docs/slug`. Aucun code à toucher.
- **Ordonner** : le préfixe `NN` (deux chiffres) contrôle l'ordre.
- **Grouper** : ajoute en tête de fichier `<!-- category: Nom -->`. Les pages
  d'une même catégorie sont regroupées dans la sidebar.
- **Résumé** (cartes de l'accueil) : `<!-- summary: une phrase -->`.
- **Titre** : le premier `# H1` du fichier (ou `<!-- title: … -->`).

Le rendu (`lib/docs.ts` + `app/docs/*`) lit ces fichiers markdown au build.
Comme la doc vit dans le repo à côté du code, **la garder à jour = un réflexe
de la même PR** qui change le comportement. Idéalement, le playbook
`document-release` met à jour la page concernée en même temps que le CHANGELOG.

> Accès : `/docs` est réservé aux comptes `is_admin` et jamais indexé. Pour
> donner l'accès à un associé/employé, mets `is_admin = true` sur son `users`.
> (Si tu veux ouvrir le manuel à tous les employés sans leur donner la console
> ops complète, c'est un changement à discuter — aujourd'hui le même flag
> gouverne les deux.)

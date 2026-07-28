<!-- category: Operations -->
<!-- summary: Le cœur de l'identité AI-native : le serveur de données MCP, les playbooks gstack, les conventions, et la discipline de release. -->

# Opérer avec l'IA

C'est **ce qui rend la boîte AI-native**. Pas « on utilise ChatGPT de temps en
temps » — l'IA est branchée sur la vraie donnée business et exécute des
*playbooks* codifiés pour concevoir, reviewer, QA, shipper et faire les rétros.
Trois piliers : **le serveur de données MCP**, **la bibliothèque de playbooks
gstack**, et **les conventions**.

## Pilier 1 — Le serveur de données MCP

Le problème que ça résout : pour piloter la boîte, Claude doit lire la **vraie
donnée** — dépenses pub Meta, revenus Stripe, leads/funnels Supabase, commits
GitHub — pas des exports figés. Le serveur MCP expose cette donnée comme des
outils que Claude appelle directement.

Trois artefacts :

- **`mcp/server.mjs`** — un serveur MCP **local en stdio** (SDK MCP + zod).
  Expose 7 outils curatés directement contre Supabase/Stripe/Meta. Tourne comme
  process `node` local dans la config Claude, avec les clés de `.env.local`.
- **`mcp/proxy.mjs`** — un petit shim stdio→HTTP : lit du JSON-RPC sur stdin et
  le POST vers `https://protocol-club.com/api/mcp` avec `Bearer $PROTOCOL_KEY`.
  Permet à un laptop de parler au serveur **distant**.
- **`app/api/mcp/route.ts`** — le serveur MCP **distant** (HTTP/JSON-RPC), le
  catalogue faisant autorité (version 2.0.0). C'est le connecteur
  `Protocol_Club` de ce workspace. Ses `instructions` embarquent un arbre de
  décision (« ne jamais dire "je ne peux pas" avant d'essayer » ; préférer
  `report` pour les séries temporelles ; fallback vers les outils raw).

### Catalogue des outils

| Outil | Ce qu'il fait |
|---|---|
| `leads` | Leads opt-in du quiz avec nom/email/UTM/morphologie/wants |
| `lead_detail` | Profil quiz complet d'un lead (toutes les réponses) |
| `funnel_stats` | Drop-off du funnel, complétion par step, taux d'opt-in, cohortes hebdo |
| `customers` | Clients payants (nom, email, date, montant, statut protocole) |
| `revenue` | Résumé revenus Stripe (total, ticket moyen, breakdown jour/semaine/mois) |
| `payments` | Liste des paiements avec UTM depuis la metadata |
| `meta_ads` | Perf Meta Ads (spend/impressions/CPM/CTR/LPV/leads/CPL/purchases) |
| `report` | ★ **Rapport maître en un appel** : joint spend Meta + revenus Stripe + leads Supabase sur une fenêtre ; cohortes hebdo avec CPL, ROAS, conversion lead→vente |
| `commits` | Commits Git récents (date/auteur/message) |
| `funnel_timeline` | Corrélation jour-par-jour commits vs KPIs |
| `meta_raw` | ★ Passthrough Meta Graph API (n'importe quel endpoint/champs) |
| `stripe_raw` | ★ Passthrough Stripe (n'importe quelle ressource) |
| `supabase_query` | ★ Lecture de n'importe quelle table avec filtres |
| `github_raw` | ★ Passthrough GitHub REST sur le repo de prod |

Les quatre outils « raw » (★) sont des **échappatoires** : quand un outil curaté
manque un champ, on tombe sur l'API sous-jacente complète. Le filtrage des tests
internes (emails de l'équipe + charges < $1) est appliqué par défaut.

> **En pratique** : « comment le ROAS a évolué par semaine depuis avril ? » →
> un seul appel `report`. « quelle pub a généré cette vente ? » →
> `payments` puis lecture de `metadata.utm_content` (= ad_id Meta).

## Pilier 2 — Les playbooks gstack

`.agents/skills/` contient **gstack**, la bibliothèque de *playbooks* de la
boîte : ~30 skills projet-locaux qui encodent **comment on travaille**. Quand une
demande matche un playbook, Claude l'invoque comme première action (routing dans
`CLAUDE.md`).

> Note d'implémentation : dans certains checkouts, les skills gstack sont des
> symlinks vers un chemin externe (`.../protocol_v2/…`). Si les skills ne
> marchent pas, rebuild avec `cd .agents/skills/gstack && ./setup --host codex`
> (voir `AGENTS.md`).

Le cycle de vie d'une feature, playbook par playbook :

| Étape | Playbook | Rôle |
|---|---|---|
| **Idéation** | `office-hours` | « est-ce que ça vaut le coup de build ça ? », brainstorming, triage produit |
| **Planification** | `autoplan`, `plan-eng-review`, `plan-ceo-review`, `plan-design-review` | Revue d'archi / produit / design d'un plan avant de coder |
| **Design** | `design-consultation`, `design-review`, `design-shotgun` | Design system, audit visuel, polish |
| **Debug** | `investigate` | Bugs, erreurs, 500s, « pourquoi c'est cassé ? » |
| **Revue** | `review` | Code review d'un diff |
| **QA** | `qa`, `qa-only` | Tester le site, trouver des bugs |
| **Ship** | `ship`, `land-and-deploy`, `canary`, `setup-deploy` | Deploy, rollout canary |
| **Post-ship** | `document-release` | Mettre à jour la doc / le CHANGELOG |
| **Rétro** | `retro` | Rétrospective hebdo |
| **Sécurité** | `cso` | Passe sécurité |
| **Divers** | `benchmark`, `upgrade`, `careful`, `guard`, `freeze`/`unfreeze` | Perf, upgrades de deps, mode prudent, garde-fous, gel de l'arbre |
| **Navigateur** | `browse`, `connect-chrome`, `setup-browser-cookies` | Automation web (utilisé par le hook screenshot) |

C'est ça, la boucle : **office-hours → plan → design → build → review → qa →
ship → document → retro** — chaque étape a un playbook, et l'IA l'exécute.

## Pilier 3 — Les conventions

Ce qui garde l'IA alignée sur la façon de faire de la boîte :

- **`CLAUDE.md`** — les « Dev Notes ». (1) Permissions : ne jamais demander
  confirmation pour lancer un outil ; demander seulement avant le mode Plan.
  (2) Workflow frontend : après chaque edit `.tsx`/`.css`, lire le screenshot
  auto-capturé `/tmp/latest-render.png` (mapping de routes fourni). (3) Table de
  routing des skills.
- **`AGENTS.md`** — guidance pour l'hôte Codex (browsing via `/gstack-browse`,
  liste des slash-commands, commande de rebuild).
- **`.claude/hooks/frontend-screenshot.sh`** — le hook qui rend la boucle
  visuelle **automatique** : après un edit `.tsx`/`.css`, il pilote le binaire
  `browse` pour aller sur la bonne route et capturer `/tmp/latest-render.png`.
  C'est ce qui matérialise le « toujours vérifier le rendu ».
- **`.claude/settings.json`** — active le plugin `frontend-design`.

## Discipline de release

- **`CHANGELOG.md`** — style Keep-a-Changelog, versionné
  `[MAJEUR.MINEUR.PATCH.MICRO] - AAAA-MM-JJ`, sections Added/Changed/Fixed.
- **`VERSION`** — une ligne, en lockstep avec `package.json`.
- **`TODOS.md`** — un **backlog piloté par les reviews** : les items déférés des
  « ship reviews », buckets P1/P2/P3 avec What / Where / Effort (temps humain vs
  « CC » = temps Claude Code) / Priority / Depends-on. C'est là que vivent les
  problèmes connus (bug de prix hosted-checkout, session-id fuité vers
  l'analytics, PDF phase 2…). **À lire avant de démarrer une feature** — voir
  *Glossaire & problèmes connus*.

## Ce que ça donne, concrètement

Un nouvel employé ou associé n'a pas besoin de « demander à quelqu'un comment on
fait ». Il demande à Claude, branché sur la vraie donnée via MCP, en suivant les
playbooks gstack. La boîte se documente et s'opère en grande partie **par
l'IA** — ce manuel en est un exemple.

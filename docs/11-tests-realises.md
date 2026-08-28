<!-- category: Précédentes itérations -->
<!-- summary: Tout le produit Protocol (attractivité/body) et les funnels d'avant : morts, mais archivés ici pour la mémoire de la boîte. -->

# Précédentes itérations

Cette page est la **mémoire des paris qu'on a arrêtés**. Le wiki « actuel »
(toutes les autres pages) ne parle que du **produit live, Protocol Dating**. Tout
ce qui concerne l'ancien produit **Protocol** (analyse d'attractivité + body
transformation) et les funnels d'avant est rassemblé **ici** — pour ne pas
polluer la doc courante, tout en gardant la trace de ce qu'on a construit et
appris.

> Règle : ce qui est décrit **sur cette page** est de l'**historique**. Le code
> existe encore dans le repo mais ne se vend plus, n'est plus maintenu, et ne
> doit servir à aucune décision courante.

---

## Usine à tests d'idées — verticals painted-door (EN COURS, depuis le 27/08/2026)

> ⚠️ Contrairement au reste de cette page, **cette section décrit des tests
> ACTIFS**, pas des paris morts. Ce sont des landings de validation de demande.

Objectif : valider la demande sur des idées de produit qui ont déjà un PMF
ailleurs (apps app-store), en clonant le **format de la landing Dating** et en
mesurant si des gens **paient** — avant de construire le produit. Chaque test =
une landing + un paywall d'abonnement Stripe + le tracking Meta/TikTok/GA4.

**Comment c'est fait (réutilisable).** Un registre `lib/experiments.ts` décrit
chaque vertical (slug, marque, offre, plans, essai gratuit). Il pilote
automatiquement les line items Stripe, les URLs de checkout, l'email de
confirmation et les données produit envoyées aux pixels. Ajouter une idée =
**une entrée dans le registre + un dossier de route**. Le paywall gère
l'abonnement (`mode:subscription`), plusieurs plans (weekly/yearly), et l'essai
gratuit (`trial_period_days`).

**Painted-door.** Les pages encaissent un vrai abonnement mais **ne livrent pas
encore le produit** : la page de succès promet une livraison, et on rembourse à
la demande. À surveiller côté disputes Stripe (rembourser vite, surtout l'essai
bluffai). Les visuels de résultat sont des **maquettes** (marquées par des
placeholders visibles en dev uniquement, masqués en prod) à remplacer par de
vrais assets avant un vrai lancement. Les témoignages / notes Trustpilot sont
des placeholders hérités du format Dating.

**Les 4 verticals live (v1.2.0.0) :**

| Route | Marque | Idée / référence | Offre (calée sur le concurrent) |
|---|---|---|---|
| `/abs` | Protocol Abs | Scan d'abdos + plan (AbMaxx) | Weekly $8.99 · Monthly $11.99 · Yearly $34.99 |

> **Visuels réels via Gemini (nano-banana).** Le pipeline `lib/nanoBanana.ts`
> (Gemini image) génère nos **propres** images de résultat, composées dans notre
> UI CSS (texte/valeurs nets). Appliqué sur **les 4 verticals** :
> - **`/abs`** (v1.2.1.0) : torse scanné du hero, zone scan, vignettes
>   d'exercices du plan.
> - **`/jewelry`** (v1.2.2.0) : bague scannée du hero + galerie "From heirlooms
>   to yard-sale finds" (5 pièces estimées : bague, collier, broche, montre,
>   boucles).
> - **`/nose`** (v1.3.0.0) : paire avant/après de profil (même visage, seul le
>   nez change) dans le hero et la section "Same face, different nose".
> - **`/bluffai`** (v1.3.0.0) : avant/après d'avant-bras (nu → faux tatouage)
>   dans le mock iMessage + galerie de 6 rendus de prank (tatouage, faux couple,
>   vieilli, chauve, couleur de cheveux, cartoon).
>
> **DA par page (v1.3.0.0).** Chaque vertical porte une couleur d'accent simple
> qui traverse le titre hero, les titres de section, la grille "what you get" et
> les mentions "verified" — **abs = vert · bluffai = violet · nose = bleu
> clinique · jewelry = or**. Layout, typo et CTA inchangés.
| `/bluffai` | Bluff AI | Éditeur photo « prank » (bluffai.app) | Weekly $6.99 **+ essai 3 j** · Yearly $39.99 |
| `/nose` | NoseLab | Preview de rhinoplastie (Nosefix) | Weekly $2.99 · Yearly $17.99 |
| `/jewelry` | GemCheck | Estimation de bijoux (Kawaii) | Weekly $4.99 · Yearly $34.99 |

Détail du process et des briefs de recherche : voir `tâches/a-faire.md` (repo).

---

## Protocol — « analyse d'attractivité + transformation » (MORT)

Le produit d'origine après le pivot depuis le tout premier « skinny-fat quiz ».
Cœur de la boîte pendant des mois ; **il ne se vend plus**.

### Ce que c'était

Une **analyse d'attractivité / composition corporelle** assistée par IA, plus un
« protocole » de transformation personnalisé (entraînement + nutrition + sommeil
+ posture) sur **3 mois**. Positionnement : *attractivité, pas volume musculaire*
— « the science of male attractiveness ». Prix live facturé : **$89**.

**Ce que le client recevait** : accès à vie à l'analyse, au protocole
personnalisé et aux ressources membres. Après paiement : lien d'inscription
(`/register?token=…`), création de compte, puis un **questionnaire d'onboarding**
gated (`/questionnaire`, 7 sections) qui alimentait le **rapport Protocol**,
livré dans l'espace membre (`/protocol`) et exportable en **PDF**. L'état de
livraison vivait sur `users.protocol_status` (`in_review` → `delivered`).

### Le funnel (mort)

```
Pub → /  (F1OfferPage $89) ou /funnel (quiz 27 slides)
    → /f1  (advertorial) → /f1/vsl  (VSL vidéo Wistia) → /f1/offer  (page de vente longue)
    → /checkout (Payment Intent embarqué, $89 en dur)
    → /register → /questionnaire (7 sections) → /protocol (rapport + PDF)
```

| Route | Rôle |
|---|---|
| `/` | Page de vente Protocol ($89), rend `F1OfferPage` |
| `/funnel`, `/qz` | Le quiz diagnostic 27 slides (+ son clone trafic pub) |
| `/f1`, `/f1/vsl`, `/f1/offer` | Advertorial → VSL → page de vente |
| `/f1/report`, `/f1/report-loading` | Rapport diagnostic HTML (`data/report-template.html`) |
| `/questionnaire` | Onboarding post-achat (7 sections) |
| `/protocol`, `/protocol/[email]` | Espace membre : protocole livré |
| `/nps/[token]` | NPS Protocol |
| `/f1-old` | Copie stale byte-identique de `/f1` |
| `/program` | `redirect("/")` — route morte, composants réutilisés |
| `/f2`, `/v3`, `/home` | Variantes A/B enregistrées (`/f2` cotait $19) |
| `/scan`, `/interface`, `/preview`, `/visualization`, `/upper-body-reel` | Outils internes / démos |

### La machinerie technique construite (et qui dort)

**Le moteur de quiz.** Deux systèmes :

1. **Legacy skinny-fat** — `lib/quizConfig.ts` + `lib/scoring.ts` : le quiz
   original 9 questions, segments + « primary blocker ». L'ADN du premier produit.
2. **Quiz 27 slides** — `app/funnel/funnel-config.ts` : moteur de slides typé
   (âge, ethnicité, morphologie, douleurs, orientation, taille/poids, temps hebdo,
   solutions passées, dream outcome, + uploads photo). Résolveurs d'images par
   âge×ethnicité. Variantes (`lib/variant.ts`, `default` | `projection`).

**Le scoring.**

- **`lib/preliminaryScore.ts`** — score préliminaire (0–100, current + potential)
  depuis les réponses du quiz (base morphologie, nudge BMI, pénalité d'âge).
- **`lib/attractivenessScore.ts`** — le « vrai » score, 6 métriques photo
  pondérées : SWR 0.35, BF% 0.25, CWR 0.15, TI 0.10, PAS 0.10, PC 0.05, ajusté
  par l'âge. Labels Elite→Needs Work + « ceiling » réaliste par âge.
- **`lib/maleBodyFat.ts`** — estimateur de % de masse grasse (18–90 ans),
  multi-formules (RFM, WHtR, Deurenberg, CUN-BAE). Fortement testé.

**Le rapport & le PDF.**

- **`lib/report-content.ts`** — copy personnalisée (patterns émotionnels par âge /
  ethnicité / environnement / historique), partagée rapport HTML + emails.
- **`lib/parseProtocolSections.ts`** — découpe un protocole markdown en 6 sections.
- **`app/pdf/`** — le PDF via `@react-pdf/renderer` (couverture avec score, TOC,
  analyse corporelle, nutrition, workout, sommeil, posture, suppléments, plan).
  Resté en download admin ; livraison email jamais finie (TODO P2).

**Personnalisation & preuve sociale.**

- **`lib/ad-variants.ts`** — ~90 `ad_id` Meta → `{badge, headline, subtext, cta}`.
- **`lib/personalization.ts`** — **Claude Sonnet** (tool_use forcé, JSON strict)
  générait la copy hero + choix de testimonial depuis les réponses libres du quiz,
  validation anti-« AI slop », 6 personas (`lib/personalizationPrompt.ts`).
- **`lib/testimonials.ts`** — 7 témoignages keyés par persona (choisis par Claude).
- **`lib/studies.ts`** — citations d'études peer-reviewed injectées dans les
  prompts de génération de rapport.

### Paiement (mort)

- **Payment Intent embarqué** (`create-payment-intent`) : `amount: 8900` **en
  dur** ($89), c'était le flow de `/f1`.
- Price IDs par funnel : `f1` = $89 (« Attractiveness Protocol — 3-Month
  Program ») ; `main` (défaut) = **$19** (« Body Analysis + Body Transformation
  Protocol »). D'où l'incohérence **$19 / $89** selon le point d'entrée.
- Webhook `payment_intent.succeeded` : ping Slack `#sales` pour chaque vente
  non-Dating, fire Meta/TikTok/GA4 `Purchase`, marque `users.has_paid`, crée le
  token d'inscription + email de bienvenue.

### Tracking (events morts)

Events funnel spécifiques au Protocol, plus émis : `quiz_started` (`StartQuiz`
CAPI), `view_offer (F1)` (`ViewContent`, valeur $89), `Lead` (`/api/lead`,
`Lead` CAPI + TikTok `CompleteRegistration`, $89), `cta_clicked`. Le pixel
navigateur codait la valeur $89 en dur pour F1.

### NPS Protocol (mort)

Passes du cron `nps-survey` visant l'ancien produit : NPS initial 2h après
`protocol_viewed_at` (`/nps/{token}`), re-sondage J+30, relances J+1/2/3. Ces
passes écrivaient en base mais **ne postaient pas** sur Slack (seul le NPS Dating
atteint #survey).

### Tables Supabase héritées

Restent en base, non alimentées : **`protocols`**, **`questionnaire_responses`**,
**`visualization_previews`**, colonnes `users.protocol_status` / `protocol_*`.
État du quiz côté client : `localStorage` `sf_quiz_state`.

### Pourquoi c'est mort

La boîte a **consolidé sur Protocol Dating** comme produit unique. Le stack
Protocol est conservé dans le repo mais **n'est plus vendu ni maintenu** : plus
de spend dirigé vers ces funnels, plus de fulfillment.

---

## Le tout premier produit — « skinny-fat quiz »

Avant Protocol, la boîte est née comme un **quiz skinny-fat** (d'où le nom de
package `skinny-fat-quiz`, encore dans `package.json`). Le quiz 9 questions
(`lib/quizConfig.ts` + `lib/scoring.ts`) en est le vestige. Pivot vers
« attractivité » (Protocol), puis vers Dating.

---

## Ce qui survit et reste live

Plusieurs briques nées pour Protocol sont **partagées et toujours utilisées par
Dating** — elles ne sont *pas* mortes, et restent documentées dans les pages
courantes :

- Le **checkout Stripe** (hosted / embedded) et le webhook.
- La **chaîne d'attribution** UTM → metadata Stripe → `ad_id` (`lib/utm.ts`,
  `funnel_sessions`).
- Le **tracking multi-canal** Meta/TikTok/GA4 + dedup + EMQ.
- Le socle **Slack** (`lib/slack.ts`), les **emails** (`lib/email.ts`), le
  **serveur MCP**, et toute la couche **Opérer avec l'IA**.

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
>
> **"Show don't tell" (v1.4.0.0).** Passe sur les 4 pages : partout où une info
> était *racontée* en texte, on la *montre* via une interface concrète (lecture
> d'un coup d'œil, layout/copy inchangés). Barres coût/délai au-dessus de chaque
> tableau old/new sur les 4 ; abs = rapport annoté ①→⑥, jauge body-fat, plans
> qui divergent, chips résultat ; bluffai = flow pick→upload→60s, frise de
> facturation du trial, preuve before/after ; nose = callouts hump/bridge/tip sur
> les vraies photos, triptyque anti-filtre, bande de comparaison de 4 variantes
> de nez (générées IA) ; jewelry = fiche d'appraisal annotée, jauge de fourchette
> de valeur, poinçons décodés (macros générées).
| `/bluffai` | Bluff AI | Éditeur photo « prank » (bluffai.app) | Weekly $6.99 **+ essai 3 j** · Yearly $39.99 |
| `/nose` | NoseLab | Preview de rhinoplastie (Nosefix) | **$29 one-time** (voir ci-dessous) |
| `/jewelry` | GemCheck | Estimation de bijoux (Kawaii) | Weekly $4.99 · Yearly $34.99 |

### `/nose` : une page de preview entre la landing et le paiement (02/09/2026, v1.4.7.0)

Avant, cliquer sur un bouton de `/nose` envoyait directement sur le formulaire de
carte bancaire. Maintenant, ça ouvre d'abord **`/nose/preview`** : une page qui
montre le produit avant de demander de payer.

**Pourquoi.** Le visiteur arrive d'une pub, n'a jamais vu l'outil, et on lui
demande $29 pour une image qu'il recevra le lendemain. Entre « je clique » et
« je sors ma carte », il manquait une étape où il voit ce qu'il achète. C'est
exactement ce que font les apps qui vendent ce genre de produit : elles montrent
l'écran du résultat, puis le prix.

**Ce qu'il y a sur la page.** Un carousel avec les visuels du produit (le même
que dans les pubs), le prix — $29 une seule fois, mis en face des $150 à $500
d'une consultation — un gros bouton de paiement, des avis, quelques chiffres,
puis la FAQ. La structure est copiée sur le paywall de retake.photos, une app
qui vend le même type de retouche photo.

**Ce qu'on va apprendre.** On saura quelle image était affichée au moment du
clic sur « payer » (l'info part avec le paiement dans Stripe), donc quel visuel
convainc. Et on compare le taux de conversion de `/nose` avant et après : si la
page en fait perdre plus qu'elle n'en convainc, on remet le paiement direct en
changeant une seule ligne de code.

**À savoir.** Le test tourne sur 100 % du trafic, il n'y a pas de moitié témoin :
la comparaison se fait avant/après, pas en parallèle. Les chiffres affichés dans
la bande d'avis (190 000 utilisateurs, etc.) viennent des visuels publicitaires
et restent à confirmer.

### `/nose` est repassé au paiement unique — $29 (31/08/2026, v1.4.6.0)

`/nose` vendait un **abonnement Weekly $2.99 / Yearly $17.99**, copié à
l'identique sur Nosefix. Il vend maintenant **$29, une seule fois**.

**Pourquoi le prix du concurrent ne marchait pas ici.** Nosefix est une **app de
l'App Store** : la personne a déjà téléchargé l'app, déjà joué avec l'outil, déjà
vu un aperçu de son résultat, et elle paie en un seul geste avec Face ID. Sur
notre page, elle arrive d'une pub, ne voit jamais le produit, doit taper un
numéro de carte, et attend 24 heures pour recevoir son image. Ce n'est pas la
même vente, donc ce n'est pas le même prix.

**Ce que $2.99 nous coûtait.**

- On ne pouvait rien apprendre. Quelqu'un qui lâche 3 dollars par curiosité, ce
  n'est pas très différent de quelqu'un qui clique. Ça ne dit rien sur l'envie
  réelle de payer pour préparer une opération à $15 000.
- La page perdait sa crédibilité. Elle explique qu'une consultation coûte
  $150-500, puis affiche $2.99. L'écart est tellement gros qu'on passe pour un
  filtre beauté gratuit plutôt que pour une vraie alternative.
- On ne pouvait pas acheter de pub. Un abonnement à $2.99 gardé une à trois
  semaines rapporte $3 à $9 au total. Aucune publicité Meta ne rentre dans ce
  budget, donc même un test « réussi » n'aurait rien prouvé.

**Pourquoi $29.** C'est le modèle qui marche déjà chez nous : `/dating` se vend
$39 une seule fois, avec exactement la même mécanique (on paie, on attend 24h, on
reçoit un livrable). $29 fait environ un dixième d'une consultation, ça reste un
achat d'impulsion en une seule décision, et ça laisse enfin de la place pour
payer de la pub.

**À savoir en lisant les résultats.** Au premier test, la pub coûtera sans doute
$70 à $200 par acheteur. Ce n'est pas rentable à $29 — et ça ne l'aurait pas été
davantage à $2.99. Le but de ce prix n'est pas de gagner de l'argent tout de
suite, c'est d'obtenir un signal qu'on peut interpréter. Grille de lecture :
coût d'acquisition sous $30 = business direct viable ; entre $30 et $100 = mort
en tant que produit à $29, à réévaluer comme canal de leads chirurgie ;
au-dessus de $100 = la verticale ne tient pas sous cette forme.

**Piste à garder en tête.** Quelqu'un qui *paie* pour prévisualiser sa
rhinoplastie est le prospect le plus qualifié qui existe pour une opération à
$9 000-20 000. En apport d'affaires esthétique, un rendez-vous qualifié se
monnaie $50-300. Si c'est ça le vrai modèle, la preview n'est pas le produit,
c'est un aimant à leads qu'on fait payer.

**Ce qui a changé techniquement.** `lib/experiments.ts` passe `/nose` en
`billing: "one_time"` avec un plan unique ; `lib/stripe.ts` n'ajoute plus de
`recurring`, donc Stripe bascule seul en paiement unique. La landing perd son
sélecteur de formule et affiche un prix unique partout (CTA, hero, carte de prix,
barre collante, comparatif). Deux bugs corrigés au passage : la description
Google de `/nose` annonçait encore « $4.99/week » (prix mort depuis v1.4.4.0), et
l'email de confirmation disait « votre abonnement est en place » sur un achat
unique.

**Ce que ça implique pour la règle générale.** On copiait jusqu'ici la structure
de prix du concurrent de chaque verticale. Cette règle ne tient que si le
concurrent vend par le même canal que nous. Les trois autres verticales (`/abs`,
`/bluffai`, `/jewelry`) portent le même décalage : elles copient des abonnements
d'apps App Store alors qu'on vend en web froid avec livraison manuelle. À
réévaluer une par une avant de pousser du trafic dessus.

**Reste ouvert.** Les témoignages et la note « 4.8 Trustpilot » de `/nose` sont
encore des placeholders hérités de Dating — à $29 sur une marque inconnue, la
preuve sociale compte plus qu'à $2.99. Et la livraison reste manuelle : à voir
combien de commandes par jour on absorbe avant que la promesse « 24 heures »
casse.

---

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

<!-- category: Technique -->
<!-- summary: Toutes les routes (live vs legacy), le moteur de quiz, le scoring, le rapport et la génération d'images Dating. -->

# Parcours & funnels

Le dossier `app/` a beaucoup de « sprawl » de funnels accumulé par itérations
A/B. Cette page fait le tri **live vs legacy** — essentiel pour ne pas toucher
du code mort.

## Carte des routes

| Route | Rôle | Statut |
|---|---|---|
| `/` | Page de vente Protocol live ($89) — rend `F1OfferPage` | **LIVE (principale)** |
| `/funnel` | Le **quiz diagnostic live** (27 slides), `noindex` | **LIVE** |
| `/qz` | Clone du quiz (même config, autre clé localStorage) — variante trafic pub | **LIVE (clone)** |
| `/f1`, `/f1/vsl`, `/f1/offer` | Advertorial → VSL vidéo (Wistia) → page de vente longue. **Le quiz envoie ici.** | **LIVE** |
| `/f1/report`, `/f1/report-loading` | Rapport diagnostic HTML (templaté depuis `data/report-template.html`) | LIVE partiel |
| `/dating`, `/dating/success`, `/dating/gallery` | Produit Dating : LP → upload → galerie | **LIVE** |
| `/questionnaire` | Onboarding post-achat Protocol (auth-gated, 7 sections) | **LIVE (fulfillment)** |
| `/protocol`, `/protocol/[email]` | Espace membre : protocole livré | **LIVE (fulfillment)** |
| `/nps/[token]`, `/nps/dating/[token]` | Sondages NPS post-livraison | **LIVE** |
| `/admin/*` | Console ops (commandes Dating, templates, NPS…) | **LIVE (interne)** |
| `/demo` | Preview marketing du questionnaire Dating | LIVE (marketing) |
| `/f1-old` | Copie stale, byte-identique de `/f1` | **MORT** |
| `/program` | `redirect("/")` — la route est morte, seuls ses composants sont réutilisés | Route **MORTE**, composants LIVE |
| `/f2`, `/v3`, `/home` | Variantes A/B enregistrées mais hors parcours live (`/f2` cote encore $19) | **LEGACY** |
| `/scan`, `/interface`, `/preview`, `/visualization`, `/upper-body-reel` | Outils internes / démos (plusieurs `noindex`) | **INTERNE / DÉMO** |

> Règle : si tu touches un funnel, vérifie d'abord ici qu'il est **LIVE**. Le
> parcours qui facture réellement est `/funnel → /f1/vsl → /f1/offer → /checkout`.

## Le moteur de quiz

⚠️ Il existe **deux systèmes de quiz** dans le code — ne pas les confondre :

1. **Legacy** — `lib/quizConfig.ts` + `lib/scoring.ts` : le quiz « skinny-fat »
   9 questions original, avec segments et « primary blocker ». **Plus branché**
   au parcours live. C'est l'ADN du tout premier produit.
2. **Live** — `app/funnel/funnel-config.ts` : un moteur de slides typé (27
   slides). Capture âge, ethnicité, morphologie, douleurs, orientation,
   taille/poids, temps hebdo, solutions passées, dream outcome, + uploads photo.
   Résolveurs d'images dynamiques par âge×ethnicité. Système de **variantes**
   (`lib/variant.ts`, `default` | `projection`).

## Le scoring (produit Protocol)

Plusieurs couches de score, selon le stade :

- **`lib/preliminaryScore.ts`** — score préliminaire (0–100, current + potential)
  estimé **uniquement depuis les réponses du quiz** (base par morphologie, nudge
  BMI, pénalité d'âge). Utilisé au stade rapport préliminaire (avant photos).
- **`lib/attractivenessScore.ts`** — le « vrai » score, calculé depuis 6
  métriques de calibration photo **pondérées** : SWR 0.35 (shoulder-to-waist),
  BF% 0.25, CWR 0.15, TI 0.10, PAS 0.10 (posture), PC 0.05. **Ajusté par l'âge**
  (fenêtres optimales qui bougent avec l'âge). Labels Elite/High/Above
  Average/Average/Below Average/Needs Work. Calcule aussi le « ceiling »
  réaliste par âge.
- **`lib/maleBodyFat.ts`** — estimateur de % de masse grasse (homme, 18–90 ans)
  via un arbre de décision multi-formules (RFM, WHtR, Deurenberg, CUN-BAE),
  avec fourchettes d'incertitude. Fortement testé.

## Le rapport & le PDF

- **`lib/report-content.ts`** — blocs de copy personnalisée (patterns
  émotionnels, contenu par âge / ethnicité / environnement / historique),
  partagés par le rapport HTML et les emails de nurture.
- **`lib/parseProtocolSections.ts`** — découpe un protocole markdown en 6
  sections nommées (plan d'action, protocole quotidien, nutrition, workout,
  sommeil, posture).
- **`app/pdf/`** — le PDF livrable via `@react-pdf/renderer` : couverture (avec
  le score d'attractivité), TOC, résumé, analyse corporelle, nutrition, workout,
  sommeil, posture, suppléments, plan d'action. **Actuellement download admin
  uniquement** ; la livraison par email au client est un TODO (P2).

## La génération d'images Dating

Le pipeline (`lib/datingGeneration.ts`), déclenché par le cron
`/api/cron/dating-generate` ou une action admin :

1. Lister les selfies source (besoin de ≥4) → choisir jusqu'à 4 refs de
   « personnage ».
2. Charger les templates actifs (`core`, + `luxury` si l'upsell est acheté).
3. **Fan-out : un appel Nano Banana par template**, concurrence 5.
4. Chaque appel : `refinePromptForPair` (Gemini réécrit le prompt depuis les
   pixels réels du template + selfie, toggle `NANOBANANA_AI_PROMPT_REFINE`) →
   `generateImage` en 1K, ratio **4:5** (survit aux crops Tinder/Hinge/Bumble)
   → upload dans `orders/{sid}/output/{slug}.jpg`.
5. **Hold de livraison** de 6–8h (« on review ») ; l'upsell priority force
   paid_at+8h ; l'admin peut livrer immédiatement. `releaseOrder` fait
   `generated → delivered`, envoie l'email + ping Slack.

Le client Nano Banana (`lib/nanoBanana.ts`) : modèle Gemini image via
l'Interactions API, jusqu'à 4 refs + 1 template, retry 3× avec backoff
exponentiel, coût ~14 cents/image. Une régénération par-photo existe côté admin
(bouton « ↻ » avec feedback correctif optionnel).

## Personnalisation par pub (ad-congruence)

Pour que la landing continue la promesse de la pub cliquée :

- **`lib/ad-variants.ts`** — mappe ~90 `ad_id` Meta → `{badge, headline,
  subtext, cta}`. `getAdVariant(adId)` (avec `adId = utm_ad ?? utm_content`)
  swappe le titre d'intro du funnel.
- **`lib/datingAdVariants.ts`** — même principe pour `/dating` (9 pubs).
- **`lib/personalization.ts`** — génère de la copy sur-mesure via **Claude
  Sonnet** (tool_use forcé pour du JSON strict) à partir des réponses en texte
  libre du quiz, avec validation anti-« AI slop ». Détail dans *Marketing*.

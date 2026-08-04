<!-- category: Technique -->
<!-- summary: Les routes live (Dating) vs le code mort, et la génération d'images Dating de bout en bout. -->

# Parcours & funnels

Le dossier `app/` a beaucoup de « sprawl » de funnels accumulé par itérations
A/B, plus tout le funnel de l'ancien produit **Protocol** (arrêté). Cette page
fait le tri **live vs mort** — essentiel pour ne pas toucher du code mort.

## Carte des routes

Le seul parcours qui facture aujourd'hui est **Dating** :
`/dating → checkout → /dating/success → génération → /dating/gallery`.

| Route | Rôle | Statut |
|---|---|---|
| `/dating`, `/dating/success`, `/dating/gallery` | Produit Dating : LP → upload → galerie | **LIVE (principal)** |
| `/nps/dating/[token]` | Sondage NPS Dating post-livraison | **LIVE** |
| `/admin/*` | Console ops (commandes Dating, templates, NPS…) | **LIVE (interne)** |
| `/demo` | Preview marketing du questionnaire Dating | LIVE (marketing) |
| `/`, `/funnel`, `/qz`, `/f1/*` | Ancien funnel Protocol (page de vente $89, quiz 27 slides, VSL, offer) | **MORT** — voir *Précédentes itérations* |
| `/questionnaire`, `/protocol`, `/protocol/[email]`, `/nps/[token]` | Fulfillment + NPS de l'ancien Protocol | **MORT** — voir *Précédentes itérations* |
| `/f1-old`, `/program`, `/f2`, `/v3`, `/home` | Copies stale, redirects, variantes A/B | **MORT** — voir *Précédentes itérations* |
| `/scan`, `/interface`, `/preview`, `/visualization`, `/upper-body-reel` | Outils internes / démos de l'ère Protocol | **MORT / DÉMO** |

> Règle : si tu touches une route, vérifie d'abord ici qu'elle est **LIVE**. Tout
> ce qui est marqué **MORT** appartient au produit Protocol arrêté — son détail
> (quiz, scoring, rapport, PDF) est archivé dans *Précédentes itérations*.

## La génération d'images Dating

C'est le cœur technique du produit live. Le pipeline (`lib/datingGeneration.ts`),
déclenché par le cron `/api/cron/dating-generate` ou une action admin :

1. Lister les selfies source (besoin de ≥4) → choisir jusqu'à 4 refs de
   « personnage ».
2. Charger les templates actifs (`core`, + `luxury` si l'upsell est acheté).
   Aujourd'hui : **30 templates `core` actifs** (= 30 photos pour une commande
   standard) + **17 `luxury`** (débloqués par l'upsell → 47 photos).
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

> **Génération en background.** 30–47 images dépassent le timeout de 60s d'une
> fonction serverless. La route admin et le cron **claim** la commande
> (`generating`) puis délèguent à la **background function Netlify**
> `netlify/functions/dating-generate-bg-background.mts` (limite 15 min) ; l'UI
> admin se rafraîchit pour voir les photos apparaître. En local (pas de Netlify),
> la génération tourne inline.
>
> **Reprise (rate-limit Nano Banana).** À 30–47 images/commande, l'API d'images
> peut throttler (429). La génération est donc **reprenable** : elle liste les
> images déjà présentes dans `orders/{sid}/output/` et **skippe** celles-là — un
> run throttlé ou coupé au timeout reprend là où il s'est arrêté (le cron le
> relance via sa fenêtre de résurrection 30 min, sans tout régénérer). Le retry
> Nano Banana **honore `Retry-After`** (`lib/nanoBanana.ts`, 4 tentatives).

## Personnalisation par pub (ad-congruence)

Pour que la landing continue la promesse de la pub cliquée :

- **`lib/datingAdVariants.ts`** — mappe les `ad_id` Meta des campagnes Dating
  (9 pubs) → contenu d'intro adapté sur `/dating`.

## Variation selon le jour de la semaine (semaine vs week-end)

Hypothèse : les prospects convertissent mieux à l'approche du week-end. En
**semaine (Lun–Ven)**, la landing pousse un angle « prépare ton week-end
maintenant » ; le **week-end (Sam–Dim)** elle reste sur la version évergreen
(celle qui convertit déjà — et « before the weekend » n'a plus de sens une fois
qu'on y est). Même URL `/dating`, une simple condition côté client.

- **H1 semaine** : *« Photos that get matches before the weekend. Without a
  photographer. »* — week-end : retombe sur *« Photos that get you matches. »*.
  Les variantes par pub (`utm_content`) gardent la priorité sur cet angle.
- **Section timeline semaine** sous le hero : *« New photos today. Matches by
  the weekend. »* (Aujourd'hui → +24h → le week-end). Cachée le week-end.
- **Barre d'urgence Lun–Jeu** : affiche *« Order now — get your matches for the
  weekend »* à la place du compte à rebours prix. Ven–Dim : garde le countdown
  prix (« $39 launch price → $59 ») — le vendredi, 24h de livraison = samedi,
  trop juste pour promettre le week-end.
- Le jour est lu **côté client après montage** (`isWeekend(new Date())` /
  `getDay()`, fuseau du visiteur) → pas de mismatch d'hydratation SSR.

> Le hero a aussi été repassé en **photos carrées** (au lieu du format
> « story » vertical), avec un encart « matches / semaine » réduit. Sur
> **mobile**, comme la nouvelle headline (plus longue) tient sur 3 lignes, le
> mur de photos est **légèrement raccourci** (un peu moins que carré) pour que
> le bouton d'achat **et** le badge Trustpilot restent visibles dès le premier
> écran, sans scroller.

> L'ancien funnel Protocol avait sa propre couche de personnalisation bien plus
> lourde (~90 pubs mappées + génération de copy par Claude Sonnet depuis les
> réponses du quiz). Elle n'est plus active — détail dans *Précédentes
> itérations*.

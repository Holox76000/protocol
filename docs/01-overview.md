<!-- category: Fondations -->
<!-- summary: La boîte en 5 minutes : ce qu'on vend, le business model, et comment lire ce manuel. -->

# Protocol en 5 minutes

Bienvenue. Ce manuel explique **comment la boîte fonctionne** — le produit, la
machine technique, le marketing, les opérations, et surtout **comment on opère
avec l'IA au centre**. Il est écrit à partir du code réel du repo. Quand le
produit change, cette doc change avec lui (voir *Getting started → Maintenir ce
manuel*).

## Ce qu'on fait

Protocol est une boîte **AI-native** de produits digitaux direct-to-consumer.
On acquiert du trafic froid via Meta et TikTok Ads, on le fait passer dans des
funnels, et on vend un produit digital généré par IA.

Aujourd'hui, **un seul produit est live** :

| Produit | Ce que c'est | Prix | Route |
|---|---|---|---|
| **Protocol Dating** | Photos de profil de dating générées par IA à partir de selfies | **$39** + 2 upsells à $20 | `/dating` |

> Le nom « Protocol » vient d'une **itération précédente** — une analyse
> d'attractivité + protocole de transformation physique ($89). Ce produit a été
> **arrêté** ; son code vit encore dans le repo mais ne se vend plus. Toute son
> histoire est dans *Précédentes itérations*.

## Le business model, vu du code

C'est une machine d'acquisition payante mesurée de bout en bout :

1. **Acquisition** — pubs Meta/TikTok. Chaque créa a un `ad_id` qui suit le
   visiteur jusqu'à la vente (`utm_content` = ad_id Meta).
2. **Landing & offre** — la LP `/dating` présente l'offre, personnalisée selon la
   pub d'origine (`lib/datingAdVariants.ts`).
3. **Conversion** — checkout Stripe. La vente est attribuée à la créa exacte.
4. **Tracking** — chaque événement est renvoyé aux plateformes pub **deux fois**
   (pixel navigateur + API serveur), dédupliqué, pour maximiser la qualité du
   signal d'optimisation.
5. **Delivery** — upload de selfies → génération d'images IA → galerie livrée,
   avec un état de commande suivi de bout en bout (voir *Produit*).
6. **Rétention / feedback** — séquences email de nurture, NPS post-livraison,
   support client bidirectionnel via Slack.

Tout ce cycle est **piloté et instrumenté par l'IA** : un serveur MCP maison
branche Claude sur la vraie donnée (Meta Ads, Stripe, Supabase, GitHub), et une
bibliothèque de *playbooks* (gstack) encode la façon dont on conçoit, review,
QA, ship et fait les rétros. C'est le sujet de **Operations → Opérer avec l'IA**.

## Comment lire ce manuel

- **Nouvel associé / non-technique** → *Fondations* puis *Operations*.
- **Nouveau dev** → *Fondations → Produit*, puis toute la section *Technique*,
  puis *Getting started*.
- **Growth / marketing** → *Fondations* puis *Marketing*.
- **Comprendre d'où on vient** → *Précédentes itérations*.

## Repères rapides

- **Repo** : `Holox76000/protocol` · **Version** : voir `VERSION` (SemVer étendu
  `MAJEUR.MINEUR.PATCH.MICRO`).
- **Hébergement** : Netlify · **Domaine** : `protocol-club.com`.
- **Stack** : Next.js 14 (App Router) · Supabase (Postgres + Storage) · Stripe ·
  Resend · Meta/TikTok/GA4 · génération d'images Gemini « Nano Banana » ·
  Anthropic SDK.
- **Nom interne du package** : `skinny-fat-quiz` (héritage du tout premier
  produit — la boîte a pivoté vers « attractivité » (Protocol), puis vers Dating.
  Voir *Précédentes itérations*).

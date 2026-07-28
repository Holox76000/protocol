<!-- category: Fondations -->
<!-- summary: Les deux lignes produit en détail : prix, ce que reçoit le client, le state machine des commandes Dating. -->

# Les produits

Deux produits partagent un seul codebase Next.js. Ils ont des funnels, des prix
et des mécaniques de delivery distincts.

## Protocol (le produit cœur)

**Ce que c'est** : une analyse d'attractivité/composition corporelle assistée
par IA, plus un « protocole » de transformation personnalisé (entraînement +
nutrition + sommeil + posture) sur 3 mois. Positionnement : *attractivité, pas
volume musculaire* — « the science of male attractiveness ».

**Prix — attention, c'est incohérent dans le code** (à connaître) :

- **Le prix live facturé est $89**, via le parcours quiz → VSL → offer →
  checkout embarqué (`app/api/create-payment-intent/route.ts`, `amount: 8900`
  en dur).
- Le funnel `main` (legacy) affiche encore **$19** (`lib/funnels.ts`,
  `DEFAULT_CHECKOUT_AMOUNT = 1900`).
- Le fallback hosted-checkout `f1` est aussi $89 (« Attractiveness Protocol —
  3-Month Program »).

Selon le point d'entrée, le « même » produit est donc décrit à $19 ou $89. **Le
parcours principal live = $89.**

**Ce que le client reçoit** : accès à vie à l'analyse corporelle, au protocole
personnalisé et aux ressources membres. Après paiement : lien d'inscription
(`/register?token=…`), création de compte, puis un **questionnaire d'onboarding**
gated (`/questionnaire`, 7 sections) qui alimente la production du **rapport
Protocol**, livré dans l'espace membre (`/protocol`) et exportable en **PDF**.
L'état de livraison vit sur la table `users` (`protocol_status` :
`in_review` → `delivered`).

## Protocol Dating

**Ce que c'est** : des photos de profil de dating générées par IA. Le client
upload 6–12 selfies ; le système transpose son visage sur des scènes
« templates » via le modèle d'image Gemini « Nano Banana », et livre une
galerie.

**Prix : $39** one-time (`unit_amount: 3900`). Plus **deux upsells post-achat à
$20** chacun (`app/api/dating/upsell/checkout/route.ts`) :

- **Priority delivery ($20)** — livraison garantie sous 8h (vs 24h avec un hold
  artificiel de 6–8h).
- **Luxury Lifestyle pack ($20)** — débloque 8 scènes « luxury » en plus (yacht,
  jet privé, chalet…), les templates de `kind = "luxury"`.

**Ce que le client reçoit** : la copy marketing dit « 30 photos, 5–6 styles, 24h ».
⚠️ **Le nombre 30 n'est pas une constante dans le code** — le nombre de photos
générées = le nombre de `dating_templates` actifs (une photo par template
actif). « 30 » est de la copy, pas une garantie technique.

### Le cycle de vie d'une commande Dating (state machine)

La colonne `dating_orders.status` suit une machine à états, contrainte en base
et mirrorée dans Slack à chaque transition :

```
paid → photos_uploaded → generating → generated → delivered
                                             ↘ failed
```

| État | Ce qui se passe |
|---|---|
| `paid` | Webhook Stripe `checkout.session.completed` (payé) crée la commande, email de confirmation, message racine Slack. |
| `photos_uploaded` | Le client a uploadé ≥6 selfies (upload direct vers Supabase Storage via URLs signées). |
| `generating` | Le worker cron génère (1 appel Nano Banana par template, concurrence 5). État verrou pour l'idempotence. |
| `generated` | Images prêtes, mais **hold de 6–8h** avant l'email (« on review vos photos »). Priority upsell → paid_at + 8h. |
| `delivered` | `releaseOrder` envoie l'email de livraison + le lien galerie + ping Slack. |
| `failed` | Erreur de génération ; le cron réessaie (les upserts rendent l'opération sûre). |

Détails techniques de la génération : *Technique → Parcours & funnels* et
*Operations → Slack & notifications*.

### Coût & marge (Dating)

Chaque image générée coûte ~**14 cents** (`COST_PER_IMAGE_CENTS`), tracké dans
`generation_cost_cents`. La marge nette est calculée et postée dans le fil Slack
de la commande. C'est le seul produit avec un coût variable par unité — d'où le
suivi de marge en temps réel.

## Le parcours client, résumé

**Protocol** : Pub → `/funnel` (quiz 27 slides) → `/f1/vsl` (VSL vidéo) →
`/f1/offer` ($89) → `/checkout` → succès → `/register` → `/questionnaire` →
livraison dans `/protocol` (+ PDF).

**Dating** : Pub → `/dating` ($39) → checkout → `/dating/success` (questionnaire
+ upload selfies) → génération → `/dating/gallery`.

Le détail route-par-route (et ce qui est *legacy*) est dans *Technique →
Parcours & funnels*.

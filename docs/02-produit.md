<!-- category: Fondations -->
<!-- summary: Le produit live (Protocol Dating) en détail : prix, ce que reçoit le client, la state machine des commandes. -->

# Le produit

**Protocol Dating** est le seul produit live. Un ancien produit (Protocol —
analyse d'attractivité + transformation) partage le codebase mais a été arrêté ;
son histoire est dans *Précédentes itérations*.

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

### Coût & marge

Chaque image générée coûte ~**14 cents** (`COST_PER_IMAGE_CENTS`), tracké dans
`generation_cost_cents`. La marge nette est calculée et postée dans le fil Slack
de la commande. C'est un produit avec un **coût variable par unité** — d'où le
suivi de marge en temps réel.

## Le parcours client, résumé

**Dating** : Pub → `/dating` ($39) → checkout → `/dating/success` (questionnaire
+ upload selfies) → génération → `/dating/gallery`.

Le détail route-par-route (et ce qui est *legacy*) est dans *Technique →
Parcours & funnels*.

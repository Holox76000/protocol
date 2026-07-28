# Protocol Club — Dev Notes

## Permissions

**Ne jamais demander de confirmation** pour exécuter des outils (bash, edit, read, screenshot, etc.). Procéder directement. Demander seulement avant d'entrer en mode Plan (`/plan`) pour aligner sur l'approche.


## Après chaque deploy (OBLIGATOIRE)

Cette règle s'applique à **toute** session, pas seulement celle en cours. **Dès qu'un deploy en prod est fait** (via `ship` / `land-and-deploy`, ou tout push sur `main` qui déclenche Netlify), effectuer **systématiquement** ces 2 étapes avant de considérer le deploy terminé :

1. **Mettre à jour le wiki** (`docs/`, docs-as-code). Identifier la/les page(s) impactée(s) par le changement et les éditer dans la foulée :
   - Changement sur le produit live (Dating) → la page primaire concernée (`docs/02-produit.md`, `docs/04-parcours-et-funnels.md`, etc.).
   - Quelque chose lié à une itération morte (Protocol / attractivité) → **`docs/11-tests-realises.md`** (catégorie *Précédentes itérations*). Le wiki « actuel » ne parle **que** de Dating.
   - Nouveau comportement → documenter sur la page pertinente.

2. **Notifier Slack** en langage **simple et non technique** (l'audience inclut des associés non-devs) : *ce que ce deploy change* et *ce que ça implique*. Utiliser le script, avec un lien vers la page wiki concernée :

   ```bash
   npx tsx scripts/notify-deploy.ts \
     --title "<titre court>" \
     --message "<explication en mots simples : ce qui change + ce que ça implique, zéro jargon>" \
     --doc <slug-de-la-page-wiki>     # ex: produit, parcours-et-funnels
   ```

   Le post part sur le canal deploy `C0BKXQRPULX` (via l'endpoint prod `app/api/notify-deploy`, qui poste avec le bot token — présent en prod uniquement). `--doc <slug>` génère le lien `https://protocol-club.com/docs/<slug>`.

## Frontend Workflow

After every edit to a `.tsx`, `.css`, or `.module.css` file, **always check the visual render** :

1. Un screenshot est pris automatiquement dans `/tmp/latest-render.png` après chaque edit frontend
2. Lis cette image avec le `Read` tool pour voir le rendu actuel
3. Si le rendu est mauvais ou que tu veux vérifier une route spécifique, utilise le browse binary directement :

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B goto http://localhost:3000/funnel && $B screenshot /tmp/render.png
# puis Read /tmp/render.png
```

**Route mapping :**
- `app/funnel/**` → `http://localhost:3000/funnel`
- `app/f1/**`, `app/home/**` → `http://localhost:3000`
- `app/dating/**` → `http://localhost:3000/dating`
- `app/dating/success/**` → nécessite un `session_id` Stripe, skip ou note-le
- `app/protocol/**` → nécessite une auth, skip ou note-le

**Règle** : Ne marque jamais une tâche frontend comme terminée sans avoir vérifié le screenshot.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint → invoke context-save ; resume → invoke context-restore
- Code quality, health check → invoke health

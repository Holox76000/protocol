# Protocol Club — Dev Notes

## Permissions

**Ne jamais demander de confirmation** pour exécuter des outils (bash, edit, read, screenshot, etc.). Procéder directement. Demander seulement avant d'entrer en mode Plan (`/plan`) pour aligner sur l'approche.


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
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

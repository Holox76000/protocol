# Protocol Club — Dev Notes

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

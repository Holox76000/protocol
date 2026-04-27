#!/bin/bash
# Auto-screenshot after frontend file edits
FILE=$(jq -r '.tool_input.file_path // ""' 2>/dev/null)
echo "$FILE" | grep -qE '\.(tsx|css)$' || exit 0

B="$HOME/.claude/skills/gstack/browse/dist/browse"

ROUTE="http://localhost:3000/funnel"
echo "$FILE" | grep -qE '/(f1|home)/' && ROUTE="http://localhost:3000"

"$B" goto "$ROUTE" 2>/dev/null
"$B" screenshot /tmp/latest-render.png 2>/dev/null
exit 0

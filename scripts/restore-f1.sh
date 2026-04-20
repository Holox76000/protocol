#!/usr/bin/env bash
# restore-f1.sh — Restaure /f1/ depuis le snapshot figé /f1-old/
# Usage : bash scripts/restore-f1.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/../app"
SRC="$APP_DIR/f1-old"
DEST="$APP_DIR/f1"

if [ ! -d "$SRC" ]; then
  echo "ERROR: $SRC n'existe pas." >&2
  exit 1
fi

echo "Restauration de /f1/ depuis /f1-old/ ..."
rm -rf "$DEST"
cp -R "$SRC" "$DEST"

# Inverser les chemins f1-old → f1 dans F1Landing.tsx
sed -i '' \
  's|useState("/f1-old/offer")|useState("/f1/offer")|g
   s|appendUtmToPath("/f1-old/offer"|appendUtmToPath("/f1/offer"|g' \
  "$DEST/F1Landing.tsx"

# Inverser les chemins f1-old → f1 dans F1OfferPage.tsx
sed -i '' \
  's|href="/f1-old"|href="/f1"|g
   s|funnel: "f1-old", page_path: "/f1-old/offer"|funnel: "f1", page_path: "/f1/offer"|g
   s|trackGa4Event("f1_offer_cta_clicked", { funnel: "f1-old"|trackGa4Event("f1_offer_cta_clicked", { funnel: "f1"|g' \
  "$DEST/offer/F1OfferPage.tsx"

echo "✓ /f1/ restauré depuis /f1-old/."

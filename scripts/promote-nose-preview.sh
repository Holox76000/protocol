#!/usr/bin/env bash
# Promote the /nose/preview gallery from local mocks to shipped assets.
#
#   npx tsx scripts/gen-nose-preview-gallery.ts   # generate + review first
#   bash scripts/promote-nose-preview.sh
#
# Every frame is cropped to the SAME face window and exported at the same size,
# because the gallery flips between them in place — any drift reads as the head
# jumping rather than the nose changing. The generated frames are 1792x2400 and
# share the framing of public/nose/before.jpg (800x1072), so the anchor crop is
# the generated crop scaled by 800/1792.
set -euo pipefail

SRC="public/_localmocks/nose/preview"
OUT="public/nose/preview"
GEN_CROP="1200x1600+620+180"   # generated frames (1792x2400)
ANCHOR_CROP="536x714+277+80"   # public/nose/before.jpg (800x1072), same window
SIZE="840x1120"

mkdir -p "$OUT"

magick public/nose/before.jpg -crop "$ANCHOR_CROP" +repage \
  -resize "$SIZE" -quality 82 -strip "$OUT/original.jpg"

for key in straight lifted slim slope button subtle greek short; do
  magick "$SRC/$key.png" -crop "$GEN_CROP" +repage \
    -resize "$SIZE" -quality 82 -strip "$OUT/$key.jpg"
done

ls -lh "$OUT"

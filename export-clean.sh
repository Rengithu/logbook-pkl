#!/bin/bash
# export-clean.sh
# Jalankan dari folder root project (tempat ada package.json, .gitignore, dll)
# Hasilnya: zip bersih tanpa node_modules/dist/database/API key/foto pribadi,
# siap dikirim ke orang lain.

set -e

SRC_DIR="$(pwd)"
PROJECT_NAME="$(basename "$SRC_DIR")"
OUT_ZIP="../${PROJECT_NAME}_clean.zip"

rm -f "$OUT_ZIP"

zip -rq "$OUT_ZIP" . \
  -x "node_modules/*" \
  -x "client/node_modules/*" \
  -x "client/dist/*" \
  -x "*/.vite/*" \
  -x ".vite/*" \
  -x "data/database.sqlite*" \
  -x "data/db.json" \
  -x "data/tasks.json" \
  -x "data/subjects.json" \
  -x "uploads/*" \
  -x ".env" \
  -x ".git/*" \
  -x ".stfolder/*" \
  -x ".stfolder.removed-*/*" \
  -x "*.log" \
  -x ".DS_Store"

echo "Selesai. File bersih: $OUT_ZIP"
echo "Cek ukurannya dan pastikan wajar (harusnya beberapa MB, bukan ratusan MB):"
du -sh "$OUT_ZIP"

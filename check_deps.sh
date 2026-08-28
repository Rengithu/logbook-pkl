#!/bin/bash
echo "=== ROOT ==="
deps=("archiver" "better-sqlite3" "dayjs" "docx" "dotenv" "express" "image-size" "lowdb" "multer" "pdfkit" "sharp" "uuid")
for dep in "${deps[@]}"; do
  echo "Checking $dep..."
  grep -rE "require\(['\"]$dep['\"]\)|from ['\"]$dep['\"]" server.js src tests scripts || echo "NOT FOUND: $dep"
done
echo "=== CLIENT ==="
cd client
client_deps=("react" "react-dom" "react-markdown" "rehype-katex" "remark-math" "zustand" "oxlint")
for dep in "${client_deps[@]}"; do
  echo "Checking $dep..."
  grep -rE "require\(['\"]$dep['\"]\)|from ['\"]$dep['\"]" src || echo "NOT FOUND: $dep"
done

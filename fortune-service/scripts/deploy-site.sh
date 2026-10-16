#!/usr/bin/env bash
# 사이트를 빌드해 공개 저장소(fortune-service-site)에 올린다.
# 사용: bash scripts/deploy-site.sh   (Git Bash, 프로젝트 루트에서)
# 소스 저장소(fortune-service)는 비공개, 사이트 저장소만 공개.
set -euo pipefail
export PATH="/c/Program Files/nodejs:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/../fortune-service-site"

cd "$ROOT/web"
rm -rf .next out
MSYS_NO_PATHCONV=1 PAGES_BASE_PATH=/fortune-service-site npm run build
mkdir -p out/prototype
cp ../prototype/index.html out/prototype/index.html
touch out/.nojekyll

cd "$SITE"
find . -mindepth 1 -maxdepth 1 ! -name .git ! -name README.md -exec rm -rf {} +
cp -r "$ROOT/web/out/." .
git add -A
git commit -m "사이트 업데이트 $(date +%Y-%m-%d)" || echo "변경 없음"
git push
echo "배포 완료: https://chaechaechae99.github.io/fortune-service-site/"

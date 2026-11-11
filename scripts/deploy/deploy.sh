#!/usr/bin/env bash
# Deploy Damakese API. Run from the API repo root on the VPS:
#   bash /opt/damakese-api/scripts/deploy/deploy.sh
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$APP_ROOT"

echo "==> Damakese API deploy @ $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "==> App root: $APP_ROOT"

if [[ -d "$APP_ROOT/.git" ]]; then
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
elif [[ -d "$APP_ROOT/../.git" && -d "$APP_ROOT/../site" ]]; then
  MONO="$(cd "$APP_ROOT/.." && pwd)"
  echo "==> Workspace pull: $MONO"
  cd "$MONO"
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
  cd "$APP_ROOT"
fi

if [[ ! -f .env ]]; then
  echo "ERROR: .env missing. cp .env.production.example .env"
  exit 1
fi

echo "==> npm ci, prisma, build"
npm ci
npx prisma generate
npx prisma db push
npm run build

ECOSYSTEM="$APP_ROOT/scripts/deploy/ecosystem.config.cjs"
if pm2 describe damakese-api >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM" --update-env
else
  pm2 start "$ECOSYSTEM"
fi
pm2 save

sleep 2
curl -sf "http://127.0.0.1:4000/days" >/dev/null && echo "API OK" || echo "WARN: API check failed"
echo "==> API deploy finished"

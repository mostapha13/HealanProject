#!/bin/bash
# اصلاح deploy production: rebuild frontendها + nginx + auth
#   cd /opt/healan && chmod +x docker/scripts/fix-production.sh && ./docker/scripts/fix-production.sh

set -euo pipefail

cd "$(dirname "$0")/../.."
PROJECT_DIR="$(pwd)"

echo "==> Project: $PROJECT_DIR"
cd "$PROJECT_DIR"

if [ -f docker/config/identity-server/appsettings.Production.json.bak ]; then
  echo "==> Restoring SQL password from backup..."
  cp docker/config/identity-server/appsettings.Production.json.bak docker/config/identity-server/appsettings.Production.json
fi

echo "==> git pull..."
git pull origin ai

echo "==> Rebuild frontends (no cache)..."
export COMPOSE_PARALLEL_LIMIT=1
docker compose build --no-cache healan-portal
docker compose build --no-cache healan-clinic
docker compose build --no-cache login

echo "==> Start backend dependencies for auth..."
docker compose up -d sqlserver redis rabbitmq
docker compose up -d identity-grpc identity-server captcha-webui identity-usermanager
docker compose up -d healan-webapi filemanager-webui api-gateway

echo "==> Start frontends + gateway..."
docker compose up -d healan-portal healan-clinic login nginx-gateway

echo "==> Waiting 10s..."
sleep 10

verify_app() {
  local container="$1"
  local expected="$2"
  local actual
  actual="$(docker exec "$container" cat /usr/share/nginx/html/.healan-app 2>/dev/null || echo MISSING)"
  if [ "$actual" = "$expected" ]; then
    echo "  OK  $container -> $actual"
  else
    echo "  FAIL $container expected=$expected actual=$actual"
    return 1
  fi
}

echo "==> Verify container apps..."
verify_app healan-portal healan-portal
verify_app healan-clinic healan-clinic
verify_app healan-login login

echo "==> Verify HTML titles..."
docker exec healan-portal head -6 /usr/share/nginx/html/index.html | grep -q "شهرویی" && echo "  OK  portal title" || echo "  FAIL portal title"
docker exec healan-clinic head -6 /usr/share/nginx/html/index.html | grep -q "هیلان" && echo "  OK  clinic title" || echo "  FAIL clinic title"
docker exec healan-login head -6 /usr/share/nginx/html/index.html | grep -q "ورود" && echo "  OK  login title" || echo "  FAIL login title"

echo ""
echo "==> Routing check..."
bash docker/scripts/check-routing.sh

echo ""
echo "Done. Test in browser:"
echo "  http://www.drshahrooei.ir        (site matab)"
echo "  http://drshahrooei.ir            (redirect -> www)"
echo "  http://clinic.drshahrooei.ir     (panel Healan)"
echo "  http://auth.drshahrooei.ir       (login)"

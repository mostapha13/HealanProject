#!/bin/bash
# Fix broken auth / Identity login (Account/Login 401 → HTML)
#   cd /opt/healan && bash docker/scripts/fix-auth.sh

set -euo pipefail
cd "$(dirname "$0")/../.."

echo "==> Pull latest ai (if online)..."
git fetch origin ai 2>/dev/null || true
git merge --ff-only origin/ai 2>/dev/null || true

echo "==> Ensure infra + identity stack..."
docker compose up -d sqlserver redis rabbitmq
sleep 5
docker compose up -d identity-grpc
sleep 10

# Recreate so stale IPs / wrong image are cleared
docker compose up -d --force-recreate identity-server captcha-webui identity-usermanager

echo "==> Wait for identity-server discovery on :5005 ..."
ok=0
for i in $(seq 1 36); do
  code=$(curl -s -o /tmp/oidc.json -w "%{http_code}" http://127.0.0.1:5005/.well-known/openid-configuration || true)
  if [ "$code" = "200" ] && grep -q '"issuer"' /tmp/oidc.json 2>/dev/null; then
    echo "  OK identity-server openid-configuration (HTTP $code)"
    ok=1
    break
  fi
  echo "  waiting... ($i/36) http=$code"
  sleep 5
done

if [ "$ok" != "1" ]; then
  echo "ERROR: identity-server is not serving OIDC. Last logs:"
  docker compose logs identity-server --tail 40
  exit 1
fi

# Direct Login page must be HTML (not AccessMiddleware JSON)
login_body=$(curl -s http://127.0.0.1:5005/Account/Login | head -c 200 || true)
if echo "$login_body" | grep -q 'Unauthorized\|missing_authorization_header\|AccessMiddleware'; then
  echo "ERROR: identity-server /Account/Login returned API 401 JSON — container image is wrong or AccessMiddleware leaked."
  echo "Rebuild with: COMPOSE_PARALLEL_LIMIT=1 docker compose build --no-cache identity-server && docker compose up -d --force-recreate identity-server"
  exit 1
fi
if ! echo "$login_body" | grep -qiE '<!DOCTYPE|<html|login|ورود|account'; then
  echo "WARN: /Account/Login response does not look like HTML. First bytes:"
  echo "$login_body"
fi

# Nginx caches upstream DNS at start — always recreate after identity changes
echo "==> Recreate nginx-gateway (refresh upstream DNS)..."
docker compose up -d --force-recreate nginx-gateway
sleep 2
docker compose exec nginx-gateway nginx -t

echo ""
echo "==> Via gateway (Host: auth.drshahrooei.ir) ==="
echo -n "  /Account/Login → "
curl -s -o /tmp/gw-login.txt -w "HTTP %{http_code}\n" -H "Host: auth.drshahrooei.ir" http://127.0.0.1/Account/Login
if grep -q 'missing_authorization_header' /tmp/gw-login.txt 2>/dev/null; then
  echo "FAIL: gateway still routes Login to an API with AccessMiddleware."
  echo "Check: docker compose ps identity-server"
  echo "       docker compose exec nginx-gateway wget -qO- http://identity-server:8080/Account/Login | head"
  exit 1
fi
head -c 120 /tmp/gw-login.txt; echo

echo -n "  /.well-known/openid-configuration → "
curl -s -o /tmp/gw-oidc.txt -w "HTTP %{http_code}\n" -H "Host: auth.drshahrooei.ir" http://127.0.0.1/.well-known/openid-configuration
grep -o '"issuer":"[^"]*"' /tmp/gw-oidc.txt | head -1 || head -c 120 /tmp/gw-oidc.txt

echo -n "  auth / → "
curl -sI -H "Host: auth.drshahrooei.ir" http://127.0.0.1/ | head -5

echo ""
echo "==> Done. Open: http://auth.drshahrooei.ir/Account/Login"
echo "    Then rebuild portal if login button still wrong:"
echo "    COMPOSE_PARALLEL_LIMIT=1 docker compose build healan-portal && docker compose up -d --force-recreate healan-portal nginx-gateway"

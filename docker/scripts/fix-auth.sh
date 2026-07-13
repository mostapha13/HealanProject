#!/bin/bash
# راه‌اندازی identity-server و چک OAuth
#   cd /opt/healan && bash docker/scripts/fix-auth.sh

set -euo pipefail
cd "$(dirname "$0")/../.."

echo "==> Start identity stack..."
docker compose up -d sqlserver redis rabbitmq
sleep 5
docker compose up -d identity-grpc
sleep 10
docker compose up -d identity-server captcha-webui identity-usermanager

echo "==> Wait for identity-server..."
for i in $(seq 1 30); do
  if docker compose ps identity-server | grep -q "Up"; then
    if curl -sf -o /dev/null -w "%{http_code}" http://127.0.0.1:5005/.well-known/openid-configuration 2>/dev/null | grep -qE '200|302'; then
      echo "  identity-server responding on port 5005"
      break
    fi
  fi
  echo "  waiting... ($i/30)"
  sleep 5
done

docker compose up -d nginx-gateway

echo ""
echo "==> Status ==="
docker compose ps identity-server identity-grpc captcha-webui healan-clinic nginx-gateway

echo ""
echo "==> OAuth endpoints (via gateway) ==="
curl -sI -H "Host: auth.drshahrooei.ir" http://127.0.0.1/.well-known/openid-configuration | head -5
curl -sI -H "Host: auth.drshahrooei.ir" http://127.0.0.1/connect/authorize | head -5
curl -sI -H "Host: clinic.drshahrooei.ir" http://127.0.0.1/ | head -5

echo ""
echo "==> identity-server logs (last 20 lines) ==="
docker compose logs identity-server --tail 20

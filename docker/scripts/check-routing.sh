#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/../.."

echo "=== Port 80 listeners ==="
ss -tlnp | grep ':80' || true

echo ""
echo "=== Container apps (.healan-app) ==="
for c in healan-portal healan-clinic healan-login; do
  if docker ps --format '{{.Names}}' | grep -qx "$c"; then
    app="$(docker exec "$c" cat /usr/share/nginx/html/.healan-app 2>/dev/null || echo MISSING)"
    title="$(docker exec "$c" sed -n 's/.*<title>\(.*\)<\/title>.*/\1/p' /usr/share/nginx/html/index.html 2>/dev/null | head -1)"
    echo "  $c -> app=$app title=$title"
  else
    echo "  $c -> NOT RUNNING"
  fi
done

echo ""
echo "=== Docker nginx server_name ==="
docker exec healan-nginx-gateway nginx -T 2>/dev/null | grep -E 'server_name|return 301' | head -30 || echo "nginx-gateway not running"

echo ""
echo "=== Host header tests ==="
for host in drshahrooei.ir www.drshahrooei.ir portal.drshahrooei.ir clinic.drshahrooei.ir auth.drshahrooei.ir; do
  echo "--- $host ---"
  curl -sI -H "Host: $host" http://127.0.0.1/ | head -8
done

echo ""
echo "=== docker compose ps ==="
docker compose ps nginx-gateway healan-portal healan-clinic healan-login identity-server captcha-webui 2>/dev/null || true

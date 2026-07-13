#!/bin/bash
# تشخیص مسیریابی دامنه‌ها روی سرور
#   cd /opt/healan && bash docker/scripts/check-routing.sh

set -euo pipefail

echo "=== Port 80 listeners ==="
ss -tlnp | grep ':80' || true

echo ""
echo "=== Docker nginx server_name ==="
docker exec healan-nginx-gateway nginx -T 2>/dev/null | grep -E 'server_name|listen' | head -40 || echo "nginx-gateway container not running"

echo ""
echo "=== Host header tests (local) ==="
for host in drshahrooei.ir www.drshahrooei.ir portal.drshahrooei.ir clinic.drshahrooei.ir auth.drshahrooei.ir; do
  echo "--- $host ---"
  curl -sI -H "Host: $host" http://127.0.0.1/ | head -5
done

echo ""
echo "=== Container status ==="
docker compose ps nginx-gateway healan-portal healan-clinic healan-login 2>/dev/null || true

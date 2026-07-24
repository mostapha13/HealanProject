#!/usr/bin/env bash
# Hotfix PWA nginx without rebuilding images.
set -euo pipefail
cd /opt/healan
CONF=docker/expo-pwa-nginx.conf
test -f "$CONF"
for c in healan-patient-pwa healan-clinic-pwa; do
  if docker ps --format '{{.Names}}' | grep -qx "$c"; then
    docker cp "$CONF" "$c:/etc/nginx/conf.d/default.conf"
    docker exec "$c" nginx -t
    docker exec "$c" nginx -s reload
    echo "OK: $c nginx reloaded"
  else
    echo "SKIP: $c not running"
  fi
done
curl -sI https://www.drshahrooei.ir/mobile/ | head -8 || true

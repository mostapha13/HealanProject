#!/usr/bin/env bash
# Apply correct PWA nginx (no /mobile redirect loop). Run on server from /opt/healan.
set -euo pipefail
CONF_DST=/tmp/healan-expo-pwa-nginx.conf
cat > "$CONF_DST" <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  charset utf-8;
  absolute_redirect off;
  port_in_redirect off;

  location = /mobile {
    return 302 /mobile/;
  }

  location ^~ /mobile/ {
    rewrite ^/mobile/?(.*)$ /$1 last;
  }

  location = /sw.js {
    add_header Cache-Control "no-cache";
    add_header Service-Worker-Allowed "/mobile/";
    try_files /sw.js =404;
  }

  location /_expo/ {
    try_files $uri =404;
    expires 30d;
    add_header Cache-Control "public";
  }

  location / {
    try_files $uri /index.html;
  }
}
EOF

# Also save into repo path for future recreates / volume mounts
mkdir -p /opt/healan/docker
cp "$CONF_DST" /opt/healan/docker/expo-pwa-nginx.conf

for c in healan-patient-pwa healan-clinic-pwa; do
  if docker ps --format '{{.Names}}' | grep -qx "$c"; then
    docker cp "$CONF_DST" "$c:/etc/nginx/conf.d/default.conf"
    docker exec "$c" nginx -t
    docker exec "$c" nginx -s reload
    echo "OK reloaded $c"
    echo "---- $c conf ----"
    docker exec "$c" grep -n 'return 302\|rewrite\|try_files' /etc/nginx/conf.d/default.conf || true
  else
    echo "SKIP $c not running"
  fi
done

echo "---- public /mobile/ ----"
curl -sI https://www.drshahrooei.ir/mobile/ | head -8

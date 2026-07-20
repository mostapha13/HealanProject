#!/bin/bash
set -euo pipefail

# اجرا روی سرور لینوکس (root) بعد از اینکه HTTP کار می‌کند.
#   cd /opt/healan
#   chmod +x docker/scripts/setup-ssl.sh
#   ./docker/scripts/setup-ssl.sh

DOMAIN="drshahrooei.ir"
EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
WEBROOT="${PROJECT_DIR}/docker/config/certbot/www"

mkdir -p "${WEBROOT}"

if ! command -v certbot >/dev/null 2>&1; then
  apt update
  apt install -y certbot
fi

certbot certonly --webroot -w "${WEBROOT}" \
  --email "${EMAIL}" --agree-tos --no-eff-email \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "portal.${DOMAIN}" \
  -d "clinic.${DOMAIN}" \
  -d "auth.${DOMAIN}"

echo ""
echo "گواهی صادر شد. حالا در docker-compose.yml برای nginx-gateway این دو خط را از کامنت دربیاورید:"
echo "  - /etc/letsencrypt:/etc/letsencrypt:ro"
echo "  - ./docker/config/nginx/nginx-gateway-ssl.conf:/etc/nginx/conf.d/ssl.conf:ro"
echo ""
echo "سپس:"
echo "  docker compose up -d --force-recreate nginx-gateway"
echo ""

# تمدید خودکار (cron دو بار در روز)
chmod +x "${PROJECT_DIR}/docker/scripts/renew-ssl.sh"
chmod +x "${PROJECT_DIR}/docker/scripts/install-ssl-renew-cron.sh"
"${PROJECT_DIR}/docker/scripts/install-ssl-renew-cron.sh"

echo ""
echo "تمدید خودکار SSL فعال شد (رایگان). لاگ: ${PROJECT_DIR}/docker/data/ssl-logs/"

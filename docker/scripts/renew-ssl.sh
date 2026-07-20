#!/bin/bash
set -euo pipefail

# تمدید گواهی Let's Encrypt و ری‌لود nginx در صورت نیاز.
# معمولاً از cron صدا زده می‌شود؛ دستی هم قابل اجراست:
#   cd /opt/healan && ./docker/scripts/renew-ssl.sh

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="${PROJECT_DIR}/docker/data/ssl-logs"
LOG_FILE="${LOG_DIR}/renew-$(date +%Y%m).log"
WEBROOT="${PROJECT_DIR}/docker/config/certbot/www"

mkdir -p "${LOG_DIR}" "${WEBROOT}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

cd "${PROJECT_DIR}"

if ! command -v certbot >/dev/null 2>&1; then
  log "ERROR: certbot نصب نیست. اول ./docker/scripts/setup-ssl.sh را اجرا کنید."
  exit 1
fi

log "Starting certbot renew..."
# --deploy-hook فقط وقتی گواهی واقعاً تمدید شود اجرا می‌شود
if certbot renew \
  --webroot -w "${WEBROOT}" \
  --quiet \
  --deploy-hook "cd '${PROJECT_DIR}' && docker compose up -d --force-recreate nginx-gateway" \
  >>"${LOG_FILE}" 2>&1
then
  log "certbot renew finished OK"
else
  log "ERROR: certbot renew failed (exit $?)"
  exit 1
fi

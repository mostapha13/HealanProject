#!/bin/bash
set -euo pipefail

# نصب cron برای تمدید خودکار SSL (دو بار در روز؛ certbot فقط در صورت نیاز تمدید می‌کند).
#   cd /opt/healan
#   chmod +x docker/scripts/install-ssl-renew-cron.sh
#   ./docker/scripts/install-ssl-renew-cron.sh

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RENEW_SCRIPT="${PROJECT_DIR}/docker/scripts/renew-ssl.sh"
CRON_MARKER="# healan-ssl-renew"
CRON_LINE="15 3,15 * * * ${RENEW_SCRIPT} ${CRON_MARKER}"

chmod +x "${RENEW_SCRIPT}"
mkdir -p "${PROJECT_DIR}/docker/data/ssl-logs"

# حذف خط قبلی همین مارکر (اگر باشد) و افزودن خط جدید
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "${CRON_MARKER}" >"${TMP}" || true
echo "${CRON_LINE}" >>"${TMP}"
crontab "${TMP}"
rm -f "${TMP}"

echo "Cron تمدید SSL نصب شد:"
echo "  ${CRON_LINE}"
echo ""
echo "لاگ‌ها: ${PROJECT_DIR}/docker/data/ssl-logs/"
echo "تست دستی: ${RENEW_SCRIPT}"
crontab -l | grep "${CRON_MARKER}" || true

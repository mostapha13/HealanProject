#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
: "${TSEAI_BASE_URL:=http://localhost:8080}"
command -v docker >/dev/null || { echo 'BLOCKED: docker missing'; exit 3; }
command -v curl >/dev/null || { echo 'BLOCKED: curl missing'; exit 3; }
test -f .env.production || { echo 'BLOCKED: .env.production missing'; exit 3; }
! grep -Eiq 'CHANGE_ME|ChangeThis|Password123' .env.production || { echo 'BLOCKED: placeholder secret in .env.production'; exit 3; }
./scripts/release-gate.sh
docker compose -f docker-compose.production.yml --env-file .env.production config >/dev/null
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
cleanup(){
  code=$?
  docker compose -f docker-compose.production.yml --env-file .env.production ps || true
  if [ "$code" -ne 0 ]; then
    docker compose -f docker-compose.production.yml --env-file .env.production logs --tail=200 || true
  fi
}
trap cleanup EXIT
for i in $(seq 1 150); do curl -fsS "$TSEAI_BASE_URL/api/health" >/dev/null && break; sleep 2; done
curl -fsS "$TSEAI_BASE_URL/api/health" >/dev/null
python scripts/runtime-readiness.py --base-url "$TSEAI_BASE_URL" --out artifacts/runtime-live.json
python scripts/evaluate-golden-dataset.py --base-url "$TSEAI_BASE_URL" --out artifacts/evaluation-live.json
python scripts/evaluate-conversation-golden.py --base-url "$TSEAI_BASE_URL" --out artifacts/conversation-evaluation-live.json
python scripts/performance-smoke.py --base-url "$TSEAI_BASE_URL" --requests 200 --concurrency 20 --out artifacts/performance-live.json
python scripts/security-dast.py --base-url "$TSEAI_BASE_URL" --out artifacts/security-live.json
python scripts/backup-restore-drill.py --env-file .env.production --out artifacts/backup-restore-live.json
python scripts/finalize-production-acceptance.py
python scripts/ga-readiness.py --require-live
printf '\nPRODUCTION E2E ACCEPTANCE PASSED\n'

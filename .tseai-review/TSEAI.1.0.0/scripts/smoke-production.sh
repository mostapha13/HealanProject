#!/usr/bin/env bash
set -euo pipefail
C="docker compose -f docker-compose.production.yml --env-file .env.production"
$C up -d
cleanup(){ $C ps; }; trap cleanup EXIT
for i in $(seq 1 60); do
  if curl -fsS http://localhost:8080/api/health >/dev/null 2>&1; then echo "gateway/api health OK"; exit 0; fi
  sleep 2
done
echo "Smoke test timed out" >&2; $C logs --tail=200; exit 1

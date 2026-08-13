@echo off
setlocal
where docker >nul 2>nul || (echo BLOCKED: Docker missing & exit /b 3)
if not exist .env.production (echo BLOCKED: .env.production missing & exit /b 3)
findstr /i /c:"CHANGE_ME" /c:"ChangeThis" /c:"Password123" .env.production >nul && (echo BLOCKED: placeholder secret in .env.production & exit /b 3)
call scripts\RELEASE-GATE.cmd || exit /b 1
docker compose -f docker-compose.production.yml --env-file .env.production config >nul || exit /b 1
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build || exit /b 1
if not defined TSEAI_BASE_URL set TSEAI_BASE_URL=http://localhost:8080
powershell -NoProfile -Command "$ok=$false; 1..150 | ForEach-Object { try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 '%TSEAI_BASE_URL%/api/health' | Out-Null; $ok=$true; break } catch { Start-Sleep -Seconds 2 } }; if (-not $ok) { exit 1 }" || exit /b 1
python scripts\runtime-readiness.py --base-url %TSEAI_BASE_URL% --out artifacts\runtime-live.json || exit /b 1
python scripts\evaluate-golden-dataset.py --base-url %TSEAI_BASE_URL% --out artifacts\evaluation-live.json || exit /b 1
python scripts\performance-smoke.py --base-url %TSEAI_BASE_URL% --requests 200 --concurrency 20 --out artifacts\performance-live.json || exit /b 1
python scripts\security-dast.py --base-url %TSEAI_BASE_URL% --out artifacts\security-live.json || exit /b 1
python scripts\backup-restore-drill.py --env-file .env.production --out artifacts\backup-restore-live.json || exit /b 1
python scripts\finalize-production-acceptance.py || exit /b 1
python scripts\ga-readiness.py --require-live || exit /b 1
echo PRODUCTION E2E ACCEPTANCE PASSED

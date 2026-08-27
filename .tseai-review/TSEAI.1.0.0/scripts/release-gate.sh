#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
fail(){ echo "RELEASE GATE FAILED: $*" >&2; exit 1; }
command -v python >/dev/null || fail "python missing"
for v in validate-structure.py validate-sprint7.py validate-sprint8.py validate-sprint9.py validate-sprint10.py validate-sprint11.py validate-agentic-ai.py validate-sprint12.py validate-sprint13.py validate-sprint14.py validate-sprint15.py validate-sprint16.py validate-sprint17.py validate-sprint18.py validate-sprint19.py validate-sprint20.py validate-sprint21.py validate-sprint22.py validate-sprint23.py validate-sprint24.py validate-sprint25.py validate-sprint26.py validate-sprint27.py validate-sprint28.py validate-sprint29.py validate-sprint30.py validate-sprint31.py validate-sprint32.py validate-sprint33.py validate-sprint34.py validate-golden-dataset.py validate-semantic-foundation.py validate-sprint35.py validate-sprint36.py validate-sprint37.py validate-sprint38.py validate-sprint39.py validate-sprint40.py; do python "scripts/$v"; done
python scripts/evaluate-conversation-golden.py --validate-only --out artifacts/conversation-evaluation-preflight.json
python -m pytest -q -W error AI/tseai-ai/tests
python -m compileall -q AI/tseai-ai/app scripts
python -m pip install --disable-pip-version-check --dry-run --require-hashes -r AI/tseai-ai/requirements.lock >/dev/null
python -m pip_audit -r AI/tseai-ai/requirements.lock --require-hashes --progress-spinner off --format json --output artifacts/pip-audit.json
command -v dotnet >/dev/null || fail ".NET SDK missing"
dotnet restore TSEAI.sln --locked-mode
dotnet build TSEAI.sln -c Release --no-restore -warnaserror
python scripts/run-dotnet-smoke.py --configuration Release --no-build
dotnet test TSEAI.sln -c Release --no-build
command -v npm >/dev/null || fail "npm missing"
test -f Frontend/package-lock.json || fail "Frontend/package-lock.json missing; generate and commit it from an approved npm registry before GA"
(cd Frontend && npm ci && npm run build && npm audit --audit-level=high)
python scripts/security-static-audit.py --out artifacts/security-static.json
python scripts/generate-sbom.py --out artifacts/sbom.cdx.json
python scripts/write-static-release-evidence.py --out artifacts/release-static.json
printf '\nSTATIC/BUILD RELEASE GATES PASSED\n'

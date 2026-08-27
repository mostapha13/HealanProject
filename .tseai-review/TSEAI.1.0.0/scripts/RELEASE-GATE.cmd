@echo off
setlocal
where python >nul 2>nul || (echo Python missing & exit /b 1)
for %%f in (validate-structure.py validate-sprint7.py validate-sprint8.py validate-sprint9.py validate-sprint10.py validate-sprint11.py validate-agentic-ai.py validate-sprint12.py validate-sprint13.py validate-sprint14.py validate-sprint15.py validate-sprint16.py validate-sprint17.py validate-sprint18.py validate-sprint19.py validate-sprint20.py validate-sprint21.py validate-sprint22.py validate-sprint23.py validate-sprint24.py validate-sprint25.py validate-sprint26.py validate-sprint27.py validate-sprint28.py validate-sprint29.py validate-sprint30.py validate-sprint31.py validate-sprint32.py validate-sprint33.py validate-sprint34.py validate-golden-dataset.py validate-semantic-foundation.py validate-sprint35.py validate-sprint36.py validate-sprint37.py validate-sprint38.py validate-sprint39.py validate-sprint40.py) do python scripts\%%f || exit /b 1
python scripts\evaluate-conversation-golden.py --validate-only --out artifacts\conversation-evaluation-preflight.json || exit /b 1
python -m pytest -q -W error AI\tseai-ai\tests || exit /b 1
python -m compileall -q AI\tseai-ai\app scripts || exit /b 1
python -m pip install --disable-pip-version-check --dry-run --require-hashes -r AI\tseai-ai\requirements.lock >nul || exit /b 1
python -m pip_audit -r AI\tseai-ai\requirements.lock --require-hashes --progress-spinner off --format json --output artifacts\pip-audit.json || exit /b 1
where dotnet >nul 2>nul || (echo .NET SDK missing & exit /b 1)
dotnet restore TSEAI.sln --locked-mode || exit /b 1
dotnet build TSEAI.sln -c Release --no-restore -warnaserror || exit /b 1
python scripts\run-dotnet-smoke.py --configuration Release --no-build || exit /b 1
dotnet test TSEAI.sln -c Release --no-build || exit /b 1
if not exist Frontend\package-lock.json (echo Frontend package-lock.json missing; generate it from approved registry before GA & exit /b 1)
pushd Frontend
call npm ci || exit /b 1
call npm run build || exit /b 1
call npm audit --audit-level=high || exit /b 1
popd
python scripts\security-static-audit.py --out artifacts\security-static.json || exit /b 1
python scripts\generate-sbom.py --out artifacts\sbom.cdx.json || exit /b 1
python scripts\write-static-release-evidence.py --out artifacts\release-static.json || exit /b 1
echo STATIC/BUILD RELEASE GATES PASSED

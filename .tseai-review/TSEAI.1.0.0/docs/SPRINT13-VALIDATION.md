# Sprint 13 Validation — Canonical Data Foundation

Status: **PASS for all executable/static gates in the packaging environment**.

## Passed
- Existing cumulative validators: Sprint 7, 8, 9, 10, 11, Agentic AI patch, Sprint 12.
- Sprint 13 canonical-data validator.
- AI Python tests: 30/30 PASS.
- SQL AI source catalog: 18 Phase-1 descriptors present.
- Read-only SQL boundary: `ApplicationIntent=ReadOnly` present and no write SQL verbs in gateway.
- Parameterized canonical lookup queries.
- Admin diagnostics require `Operations.Read`.
- Local and Production Compose parse with `ConnectionStrings__SqlAi` and explicit source money-unit contract.
- User-approved SQL migration and data-source contract are embedded in package docs.

## Environment gates not executable here
- `dotnet restore/build/test`: .NET SDK is not installed in this packaging environment.
- Live SQL AI connection/query validation: requires the user's SQL AI database and read-only credential.
- Docker Compose build/live smoke: Docker runtime is not available in this packaging environment.

## Required target-host checks
```text
dotnet restore TSEAI.sln
dotnet build TSEAI.sln -c Release -warnaserror
dotnet test TSEAI.sln -c Release
python scripts/validate-sprint13.py
python -m pytest -q AI/tseai-ai/tests
```

Then configure `SQL_AI_CONNECTION_STRING` and verify:

```text
GET /api/admin/canonical/status
GET /api/admin/canonical/instrument/{known-InstrumentID}
GET /api/admin/canonical/market/{known-InstrumentID}
GET /api/admin/canonical/summary?marketId=20
```

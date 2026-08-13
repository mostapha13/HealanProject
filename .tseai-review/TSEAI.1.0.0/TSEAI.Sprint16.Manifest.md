# TSEAI Sprint 16 — Data Quality & Freshness Engine

Baseline: `TSEAI.Sprint15.PersianEntityInstrumentResolver.zip`
Version: `1.0.0-rc.5`
Status: Implemented / statically validated; runtime .NET/SQL-AI/Redis/Docker gates remain required on the target host.

## Primary additions
- `Backend/Platform/src/TSEAI.Application/DataQuality/DataQualityContracts.cs`
- `Backend/Platform/src/TSEAI.Infrastructure/DataQuality/DataQualityService.cs`
- Chat quality gate (`data-quality.market`)
- Filter `QualityRejected` enforcement
- `/api/admin/data-quality/sources`
- `/api/admin/data-quality/market/{key}`
- `Backend/Platform/tests/TSEAI.DataQuality.SmokeTests/*`
- `docs/ADR/0008-data-quality-freshness-boundary.md`
- `docs/SPRINT16.md`
- `docs/SPRINT16-VALIDATION.md`
- `tests/data-quality-cases.json`
- `scripts/validate-sprint16.py`

## Safety
Invalid/stale market facts fail closed. Warnings remain explicit. No source values are silently repaired. LLM cannot override Data Quality decisions.

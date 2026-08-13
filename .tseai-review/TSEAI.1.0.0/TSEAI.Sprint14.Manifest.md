# TSEAI Sprint 14 — Persian Temporal Intelligence Engine

Baseline: `TSEAI.Sprint13.CanonicalDataFoundation.zip`
Version: `1.0.0-rc.3`
Status: Implemented / statically validated; runtime .NET/Docker gates remain required on the target host.

## Primary additions
- `Backend/Platform/src/TSEAI.Application/Temporal/TemporalContracts.cs`
- `Backend/Platform/src/TSEAI.Application/Temporal/PersianTemporalNormalizer.cs`
- `Backend/Platform/src/TSEAI.Application/Temporal/PersianNumberParser.cs`
- `Backend/Platform/src/TSEAI.Application/Temporal/PersianTemporalResolver.cs`
- Chat temporal metadata + historical/future market fail-closed guard
- `/api/temporal/resolve`
- `Backend/Platform/tests/TSEAI.Temporal.SmokeTests/*`
- `docs/ADR/0006-persian-temporal-intelligence.md`
- `docs/SPRINT14.md`
- `docs/SPRINT14-VALIDATION.md`
- `tests/temporal-resolution-cases.json`
- `scripts/validate-sprint14.py`

## Supported examples
`امروز`, `فردا`, `پس فردا`, `دیروز`, `پریروز`, `4روز بعد`, `چهار روز بعد`, `20/05/1405`, `1405/05/20`, `20 مرداد 1405`, `بیست مرداد 1405`, named ranges and explicit ranges.

## Validation summary
- Sprint 7-13 cumulative validators: required to PASS
- Agentic AI validator: required to PASS
- Sprint 14 validator: PASS in packaging environment
- Python AI tests: 32/32 PASS
- .NET temporal smoke test: wired into target-host Release Gate
- .NET build/Docker E2E: target-host gate

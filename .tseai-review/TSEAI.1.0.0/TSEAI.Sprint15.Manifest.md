# TSEAI Sprint 15 — Persian Entity & Instrument Resolver

Baseline: `TSEAI.Sprint14.PersianTemporalIntelligence.zip`
Version: `1.0.0-rc.4`
Status: Implemented / statically validated; runtime .NET/SQL-AI/Docker gates remain required on the target host.

## Primary additions
- `Backend/Platform/src/TSEAI.Application/Entities/EntityResolutionContracts.cs`
- `Backend/Platform/src/TSEAI.Application/Entities/PersianEntityNormalizer.cs`
- `Backend/Platform/src/TSEAI.Application/Entities/PersianEntityResolver.cs`
- `Backend/Platform/src/TSEAI.Infrastructure/Entities/SqlAiEntityCandidateSource.cs`
- Chat `entity.resolve` trust boundary and canonical market lookup
- `/api/admin/entity/resolve`
- deterministic multi-word entity hints in Python Chat planner
- `Backend/Platform/tests/TSEAI.EntityResolution.SmokeTests/*`
- `docs/ADR/0007-persian-entity-instrument-resolution.md`
- `docs/SPRINT15.md`
- `docs/SPRINT15-VALIDATION.md`
- `tests/entity-resolution-cases.json`
- `scripts/validate-sprint15.py`

## Entity kinds
Instrument, MarketIndex, Company, TsePerson, RegionHall, FinancialInstitution.

## Safety
Unknown and ambiguous entities fail closed. LLM output is never accepted as Instrument identity. SQL AI is read-only and parameterized.

## Validation summary
- Cumulative Sprint 7-15 validators: PASS
- Python AI tests: 40/40 PASS
- JSON/XML/YAML/Python/Shell/C# structural sanity: PASS
- .NET build + Entity smoke + live SQL AI + Docker E2E: target-host gates

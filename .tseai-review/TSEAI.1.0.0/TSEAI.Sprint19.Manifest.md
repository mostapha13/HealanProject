# TSEAI Sprint 19 Manifest

- Release: `1.0.0-rc.8`
- Sprint: 19 — Natural Language Structured Query
- Baseline: Sprint 18 `1.0.0-rc.7`

## Added
- `TSEAI.Application/StructuredQuery/StructuredQueryContracts.cs`
- `TSEAI.Application/StructuredQuery/PersianNaturalLanguageStructuredQueryInterpreter.cs`
- `TSEAI.Application/StructuredQuery/StructuredQueryService.cs`
- `TSEAI.StructuredQuery.SmokeTests`
- `/api/structured-query/execute`
- Chat `StructuredQuery` intent/result integration
- ADR, Sprint docs, validation corpus and cumulative validator

## Invariants retained
Temporal fail-closed, deterministic entity resolution, Data Quality/Freshness, Secure Structured Tool boundary, deterministic market analytics, TSETMC filter engine isolation and no arbitrary SQL/tool execution.

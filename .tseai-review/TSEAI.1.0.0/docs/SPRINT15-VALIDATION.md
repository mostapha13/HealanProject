# Sprint 15 Validation — Persian Entity & Instrument Resolution

## Static/contract gates
- Entity contracts, normalizer, resolver and SQL AI candidate source present.
- Read-only `SqlAi` connection enforced.
- SQL values parameterized; no arbitrary SQL/tool/URL execution.
- Chat tool policy explicitly allow-lists `entity.resolve`.
- Market/Hybrid Chat resolves before `market.symbol` execution.
- Ambiguous/no-match paths fail closed.
- Instrument market lookup prefers canonical `InsCode`.
- Multi-word deterministic planner hints covered by Python tests.
- `/api/admin/entity/resolve` endpoint present.

## Runtime smoke corpus
`TSEAI.EntityResolution.SmokeTests` has no external package dependency beyond the Application project and tests:
- Persian/Arabic character normalization
- ZWNJ and diacritic normalization
- exact symbol
- company-name alias
- Persian-digit `InsCode`
- market index classification
- ambiguity guard
- person entity
- no-match behavior

The smoke project is included in `TSEAI.sln` and both Linux/Windows release gates.

## Packaging-environment result
- Cumulative static validators through Sprint 15: PASS
- Python AI tests: 40/40 PASS
- .NET build/entity smoke: target-host gate because the packaging environment has no .NET SDK
- SQL AI live entity query: target-host/integration gate
- Docker E2E: target-host gate

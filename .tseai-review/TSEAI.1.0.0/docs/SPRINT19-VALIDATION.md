# Sprint 19 Validation

## Static release checks
- Structured Query contracts/interpreter/service exist.
- DI and API endpoint registration exist.
- Chat integration exists before the generic planner path.
- Typed metrics/operators only; no arbitrary SQL execution surface.
- Quality gate and deterministic analytics are used during execution.
- Unavailable analytics values evaluate as missing and cannot match a condition.
- `Take` is bounded to 1..200.
- Single-symbol market questions are not captured as market-wide screening.
- Version is at least `1.0.0-rc.8` and API root reports Sprint 19+.

## Runtime smoke cases
The .NET smoke project asserts parsing, execution, unavailable BuyerPower behavior, and single-symbol non-interception.

## Environment gates
`dotnet restore/build/test`, .NET smoke execution, live SQL-AI/Redis integration and Docker E2E remain mandatory on a machine with the required SDK/runtime.

# Sprint 14 Validation — Persian Temporal Intelligence

## Packaging-environment checks
- Required Temporal source files: PASS
- Temporal case corpus JSON: PASS
- Persian/Arabic digit normalization markers: PASS
- Jalali `PersianCalendar` implementation marker: PASS
- `Asia/Tehran` market timezone: PASS
- exact/relative/range rules: PASS
- Thursday/Friday weekly-closure classification: PASS
- no LLM/HTTP dependency in resolver: PASS
- Chat temporal metadata integration: PASS
- historical/future current-market fail-closed guard: PASS
- API `/api/temporal/resolve`: PASS
- `temporal.resolve` tool allow-list: PASS
- DI registration: PASS
- runtime smoke project wired to solution/release gate: PASS
- existing Sprint 7-13 validators: PASS
- Python AI tests: 32/32 PASS

## Target-host runtime gate
The packaging environment has no .NET SDK, therefore the C# resolver cannot be executed here. On the target/CI host the Release Gate must run:

```bash
dotnet build TSEAI.sln -c Release --no-restore -warnaserror
dotnet run --project Backend/Platform/tests/TSEAI.Temporal.SmokeTests/TSEAI.Temporal.Smoke.csproj -c Release --no-build
```

The smoke test fixes the reference instant at `2026-08-11T08:00:00Z` and validates the Jalali reference date `1405/05/20`, numeric/month-name forms, relative dates, ranges, future/weekend classification, no-date behavior and invalid-date failure.

## Known deliberate limitation
Only the recurring weekly closure (Thursday/Friday) is deterministic in Sprint 14. Official exchange holidays require an authoritative holiday source and are not guessed.

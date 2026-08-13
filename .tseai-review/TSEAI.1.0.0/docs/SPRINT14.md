# Sprint 14 — Persian Temporal Intelligence Engine

## Goal
Provide a deterministic Persian/Jalali temporal understanding layer shared by Chat, Filter and future Tool planning, while preventing current market snapshots from being misrepresented as historical or future facts.

## Implemented

### 1. Canonical temporal contract
`TSEAI.Application.Temporal` defines:
- `TemporalResolutionStatus`
- `TemporalIntentKind`
- `CanonicalDatePoint`
- `MarketDayKind`
- `TemporalResolution`
- `IPersianTemporalResolver`

Every resolved date includes both `JalaliDate` and `GregorianIso` plus `Asia/Tehran` market context.

### 2. Persian normalization
Before parsing:
- Persian digits `۰..۹` and Arabic digits `٠..٩` become ASCII digits;
- Arabic `ي/ى/ك` normalize to Persian `ی/ک`;
- ZWNJ, RTL/LTR marks and NBSP normalize to spaces;
- repeated whitespace collapses.

### 3. Supported single-date expressions
Examples covered by the deterministic engine:

```text
امروز
فردا
پس فردا
دیروز
پریروز
4 روز بعد
4روز بعد
چهار روز بعد
سه روز قبل
20/05/1405
1405/05/20
۱۴۰۵/۰۵/۲۰
20 مرداد 1405
بیست مرداد 1405
بیستم مرداد 1405
2026-08-11
اول ماه
آخر ماه
```

### 4. Supported ranges

```text
از 10 مرداد تا 20 مرداد 1405
از امروز تا فردا
از اول ماه تا امروز
این هفته / هفته جاری
هفته قبل / هفته گذشته
هفته بعد / هفته آینده
ماه جاری / این ماه
ماه قبل / ماه گذشته
ماه بعد / ماه آینده
7 روز اخیر
سه هفته اخیر
سه ماه اخیر
امسال / سال جاری
سال قبل / سال گذشته
```

Persian week boundaries are Saturday through Friday.

### 5. Market-day classification
Each resolved date is classified as:
- `TradingDayCandidate`
- `WeekendClosed`
- `FutureTradingDayCandidate`
- `FutureWeekendClosed`

Thursday and Friday are weekly closure days. `HolidayCalendarEvaluated=false` is explicit because no official holiday feed is connected in Phase 1.

### 6. Chat integration and fail-closed behavior
`ChatOrchestrator` resolves temporal context before the AI planner and returns it in the Chat response.

For `MarketSymbol`, `MarketFilter` and `Hybrid` plans:
- `امروز` or an exact date equal to the Tehran reference day may use the current market snapshot;
- past dates/ranges do **not** fall back to today's snapshot;
- future dates do **not** fabricate market data;
- Thursday/Friday requests are identified as weekly closure when applicable;
- historical requests explain that `MarketDailyHistory` is not yet connected.

Knowledge-only queries are not blocked simply because they mention a past/future date; temporal filtering of RAG arrives in later retrieval sprints.

### 7. API
A deterministic diagnostics endpoint is available under the global rate limiter:

```text
POST /api/temporal/resolve
```

Request:

```json
{
  "text": "بیست مرداد 1405",
  "referenceUtc": "2026-08-11T08:00:00Z"
}
```

`referenceUtc` is optional and exists for deterministic diagnostics/tests. Chat uses the server clock.

### 8. Runtime smoke test
A zero-third-party-package .NET console smoke project validates temporal behavior with a fixed reference date:

```text
Backend/Platform/tests/TSEAI.Temporal.SmokeTests
```

The Release Gate runs it after the solution build on a host with .NET 9.

## Non-goals
- Official exchange holiday calendar integration.
- Historical market query execution (`MarketDailyHistory` is still pending).
- Temporal filtering inside TSETMC filters (Sprint 22).
- Conversational reference chaining such as “یک روز قبلش / سه روز بعدش” (Sprint 29).
- Fuzzy Instrument/Entity resolution (Sprint 15).

## Security / correctness invariants
- No LLM is involved in date conversion.
- No `DateTime.Parse` locale guessing is used for user temporal expressions.
- Future market facts are never invented.
- Past market requests never silently use current snapshots.
- Invalid Jalali dates fail closed.

## Definition of Done
- Temporal contracts and deterministic resolver are present.
- Persian/Jalali examples requested by the user are covered.
- Chat exposes resolved temporal metadata.
- Market current-snapshot guard is active.
- API diagnostics endpoint is present.
- Runtime smoke test project is wired into the Release Gate.
- Sprint 14 validator and Python AI tests pass.
- Existing Sprint 7-13 validators remain green.

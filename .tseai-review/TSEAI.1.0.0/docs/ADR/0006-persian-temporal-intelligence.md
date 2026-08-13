# ADR-0006 — Persian Temporal Intelligence is deterministic and market-time aware

Status: Accepted — Sprint 14

## Context
TSEAI users may express time in Persian in many equivalent forms: `امروز`, `دیروز`, `فردا`, `پس فردا`, `4روز بعد`, `چهار روز قبل`, `1405/05/20`, `20/05/1405`, `20 مرداد 1405`, `بیست مرداد 1405`, ranges and follow-up temporal expressions.

Passing these phrases directly to an LLM or allowing each tool to interpret them independently would create inconsistent dates and unsafe market answers.

## Decision
- `TSEAI.Application.Temporal` owns one deterministic temporal contract.
- Persian/Arabic digits, Arabic/Persian character variants and ZWNJ/whitespace are normalized before parsing.
- Jalali conversion uses .NET `PersianCalendar`; Gregorian dates use `DateOnly`.
- Market reference time is `Asia/Tehran` with a Windows-ID fallback and a final +03:30 fallback only when platform timezone data is unavailable.
- The engine resolves exact dates, relative dates, named ranges and explicit `از ... تا ...` ranges without LLM calls.
- The response includes Jalali and Gregorian dates, matched text, rule, confidence and market-day classification.
- Thursday/Friday are classified as weekly market closure. Official/ad-hoc exchange holidays are **not** inferred without a holiday source; weekday dates are therefore `TradingDayCandidate`.
- Current-snapshot market tools fail closed for resolved past/future/range requests until `MarketDailyHistory` is connected. They never silently substitute today's snapshot for a different date.

## Consequences
Temporal output becomes a reusable input contract for later Structured Query, Filter+Temporal and Conversation Context sprints. Historical `[ih]` support can attach later without changing the parser contract.

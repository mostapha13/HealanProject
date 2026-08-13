# Sprint 19 — Natural Language Structured Query

Version: `1.0.0-rc.8`

## Goal
Allow Persian users to ask bounded market-wide screening and ranking questions without writing SQL or the TSETMC filter DSL.

## Examples
- `10 نماد با بیشترین حجم معاملات را بده`
- `نمادهایی که P/E کمتر از 6 دارند را بده`
- `نمادهایی که قدرت خریدار بالای 2 دارند`
- `کمترین ارزش بازار را نشان بده`

## Architecture
1. Normalize Persian/Arabic characters and digits.
2. Detect supported metric conditions, ordering, result limit and market scope.
3. Produce a typed `StructuredQueryPlan`.
4. Validate plan limits and shape.
5. Read the bounded active market universe.
6. Enforce Sprint 16 Data Quality for every snapshot.
7. Calculate Sprint 18 deterministic analytics.
8. Exclude unavailable metrics rather than substituting zero.
9. Sort/filter deterministically and return at most 200 rows.
10. Expose the result in `/api/structured-query/execute` and Chat.

## Safety
- No arbitrary SQL.
- No dynamic table/column identifier from user/LLM text.
- No arbitrary MCP/HTTP execution.
- Historical/future requests remain fail-closed while `MarketDailyHistory` is pending.
- Chat screening interception is confidence-gated and falls back to the existing planner when not confidently detected.

## Explicitly deferred
- Full conversational TSETMC filter authoring/editing: Sprint 20/21.
- Historical `[ih]` screening: requires `MarketDailyHistory`.
- Index-impact ranking: requires `EffectOnIndex` to be promoted into the runtime market snapshot/tool contract.

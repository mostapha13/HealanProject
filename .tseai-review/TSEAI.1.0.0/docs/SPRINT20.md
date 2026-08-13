# Sprint 20 — Chat-Integrated TSETMC Filter Engine

Status: Complete
Version: 1.0.0-rc.9

## Delivered
- Deterministic chat filter intent detector.
- Direct raw TSETMC DSL support inside chat.
- Persian explicit filter requests routed to existing bounded conversation planner.
- DSL extraction from natural-language wrappers and Markdown code fences.
- Parser → AST → validator → canonical exporter → quality-gated execution.
- Direct DSL persisted as conversation filter state.
- `[ih]` fail-closed until MarketDailyHistory exists.
- `filter.chat` added to ChatToolPolicy allow-list.
- Canonical filter code and Persian explanation returned in Chat response.

## Examples
- `(pl)==(tmax) && (qd1)>=200000000`
- `فیلتر کن (pl)>(pc) && (tvol)>(bvol)`
- `صف خریدها رو فیلتر کن`

## Out of scope
Advanced conversational editing UX is Sprint 21; historical `[ih]` execution requires MarketDailyHistory.

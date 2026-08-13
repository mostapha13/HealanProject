# ADR 0012 — Chat-Integrated TSETMC Filter Engine

## Decision
Chat filter requests are intercepted deterministically before the generic AI planner. Raw TSETMC DSL is extracted, parsed to AST, validated against the allow-listed field registry, canonicalized, persisted to conversation filter state, and executed through the existing quality-gated FilterExecutionService. Explicit Persian filter requests use the bounded conversation filter planner, then pass through the same deterministic validator/executor.

## Safety invariants
- No arbitrary SQL, JavaScript, URL, MCP, or dynamic table access.
- Raw DSL never bypasses lexer/parser/AST validation.
- Unsupported fields/functions fail closed.
- `[ih]` is rejected until MarketDailyHistory is connected.
- Invalid/stale symbols are excluded by Data Quality Gate.
- Direct DSL becomes conversation state so later edit/undo/redo can operate on the same AST.

## Routing
Temporal Resolver → deterministic chat-filter detection → Filter Engine. Non-filter questions continue to Structured Query / Chat Planner.

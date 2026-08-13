# ADR 0014 — Filter + Temporal Integration

## Decision
All Chat filter execution uses the canonical `IPersianTemporalResolver` and a deterministic `IFilterTemporalPolicy` before any filter state mutation or market scan.

Temporal scope is an **execution concern**, not part of the TSETMC AST/DSL. The conversation filter state therefore remains reusable and timeless.

## Current execution policy
- No explicit date: current market snapshot.
- `امروز` or an exact date equal to the resolver reference date: current market snapshot.
- Historical exact date or any historical range: fail closed because `MarketDailyHistory` is not connected.
- Future date/range: fail closed; future market facts are never generated.
- Weekly closed day: fail closed rather than substituting another session.
- `[ih]`: fail closed independently of natural-language temporal scope until historical source support exists.

## Security / correctness invariant
Direct TSETMC DSL is not a bypass. DSL, natural-language filters and conversational edits all pass through the same temporal policy before execution or mutation.

Temporal expressions are stripped from the text passed to the filter parser/planner after resolution, so date words cannot contaminate canonical DSL.

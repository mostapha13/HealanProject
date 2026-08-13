# Sprint 28 — Conversational Context Intelligence

Status: COMPLETE
Version: 1.0.0-rc.17

## Goal
Preserve conversation referents without caching market facts. Follow-up questions reuse the authoritative entity reference while every market answer re-reads current data through Structured Tool Gateway and Data Quality Gate.

## Capabilities
- Redis-backed context keyed by `subject + conversationId`, TTL 6 hours.
- Primary entity carry-forward for market, knowledge and hybrid follow-ups.
- Deterministic route hints:
  - `حقیقی حقوقیش؟` / `اردربوکشم بگو` → MarketSymbol
  - `آخرین خبرش؟` → Knowledge
  - `چرا افت کرده؟` → Hybrid
- Explicit correction: `نه منظورم خساپا بود` replaces the primary referent.
- Comparison follow-up: `حالا با خساپا مقایسه کن` keeps the prior primary entity and resolves a secondary entity.
- Deterministic `MarketComparison` route with both snapshots quality-gated and analytics recalculated from fresh snapshots.
- Context stores entity identifiers and route metadata only; it does **not** store prices, volumes, order books or analytics facts.
- Filter state remains owned by the existing Conversation Filter subsystem; Sprint 28 records only that the last route was a filter route.

## Temporal boundary
Sprint 28 records explicit temporal metadata for continuity/audit, but relative-date chaining against a previous date is intentionally deferred to Sprint 29.

## Fail-closed behavior
- Ambiguous/unresolved secondary comparison entity does not guess.
- Comparison requires two resolved instruments.
- If either current snapshot fails Data Quality/Freshness, comparison fails instead of mixing good and stale data.

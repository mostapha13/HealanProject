# Sprint 17 — Secure Structured Tool Gateway

## Goal
Create the authoritative structured-fact boundary between Chat/AI orchestration and SQL AI/Redis.

## Delivered
- Fixed allow-listed structured tool registry.
- Strongly typed `StructuredToolCall` / `StructuredToolResult` contracts.
- Deterministic entity resolution before entity-scoped tool execution.
- `market.get_symbol_snapshot` integrates Data Quality/Freshness and fails closed.
- Canonical tools for instrument, order book, client type, market summary and market indexes.
- Chat MarketSymbol/Hybrid path now uses the structured gateway instead of direct Redis access.
- Operations-only diagnostics API: `/api/admin/structured-tools`.
- No arbitrary SQL/table/tool names are derived from LLM text.

## Out of scope
Sprint 18 owns deterministic higher-level market analytics. Sprint 20+ owns conversational filter authoring enhancements.

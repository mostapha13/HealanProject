# ADR-0005 — SQL AI is a read-only landing source behind a canonical boundary

Status: Accepted — Sprint 13

## Context
TSEAI now consumes a dedicated SQL Server database named SQL AI/`AI` whose tables are refreshed by external jobs. The landing schema intentionally preserves legacy column names because the upstream databases also serve other systems. Directly coupling Chat, Filter, RAG or future tools to those legacy names would make the AI layer brittle and would allow source-specific semantics to leak throughout the product.

## Decision
- SQL AI is treated as a **read-only landing/read-model source**.
- Application code depends on `ICanonicalDataGateway`, never directly on legacy table/column names.
- Legacy-to-canonical mapping is implemented in Infrastructure (`SqlAiCanonicalDataGateway`).
- `InstrumentID` is the primary canonical instrument identity where available; `InsCode` remains a market-source bridge key.
- Monetary values are normalized to IRR through an explicit source-unit contract. No magnitude-based guessing is allowed.
- `SourceCollectedAt` is the ingestion/collection timestamp, not automatically the business/effective date.
- Ambiguous source fields such as `MinValue`/`MaxValue` are preserved as explicitly named raw canonical fields until their business semantics are documented.
- No LLM is allowed to parse structured numeric facts when the canonical gateway can provide them.
- Source table refresh strategy is external to TSEAI Sprint 13; this sprint assumes the SQL AI landing database is already kept current.

## Consequences
This boundary enables future Temporal Resolution, Entity Resolution, Structured Tools, deterministic analytics and Hybrid RAG without reworking upstream jobs or the legacy databases.

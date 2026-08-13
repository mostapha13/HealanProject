# ADR 0018 — Intent & Capability Router

## Decision
All Chat requests pass through one capability router after temporal resolution. Deterministic detectors have priority for persistent filter assets, TSETMC/conversational filters, and structured market screening. The AI planner is a bounded fallback for semantic MarketSymbol/Knowledge/Hybrid intent and entity hints.

Planner output is projected to a fixed registry of capabilities and authorities. It cannot name arbitrary tools, SQL, URLs, shell operations, or MCP servers.

## Audit
Each decision emits `capability.route` trace data containing route, confidence, planner-used flag and reason codes.

## Authority
- Numeric/live market facts: canonical SQL/Redis through quality-gated tools.
- Knowledge: Qdrant grounded evidence.
- Hybrid: both, with structured data retaining numeric authority.

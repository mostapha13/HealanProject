# Sprint 30 — Evidence & Citation Engine

Sprint 30 introduces a unified provenance contract for Structured, RAG, Hybrid, Analytics, Structured Query and Filter answers.

## Evidence labels
- `M#` canonical market snapshot
- `K#` grounded knowledge document
- `A#` deterministic analytics
- `Q#` structured query execution/rows
- `F#` filter execution

Evidence contains authority, source type/id, observation/publication time where available, instrument/symbol, quality status and machine-readable claims. Unknown source ids and citation labels that do not map to returned evidence fail validation.

Structured market facts remain authoritative from SQL AI/Redis; Qdrant evidence never becomes numeric market authority. Analytics evidence is explicitly marked as deterministic calculation derived from validated market facts.

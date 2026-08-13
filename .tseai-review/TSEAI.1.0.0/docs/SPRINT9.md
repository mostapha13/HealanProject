# Sprint 9 — Knowledge / RAG Foundation

## Goal
Build the reusable knowledge retrieval boundary used by Sprint 10 Chat Orchestrator without mixing market-number execution with unstructured knowledge retrieval.

## Delivered
- Canonical `KnowledgeDocument` and deterministic chunk identifiers.
- Persian normalization (`ي/ك`, diacritics, ZWNJ, whitespace).
- Paragraph-aware overlapping chunking.
- Pluggable embedding provider:
  - OpenAI-compatible local/remote embedding HTTP endpoint.
  - deterministic 384-dimensional offline hashing fallback for development and zero-network startup.
- Qdrant collection bootstrap, upsert, document replacement and metadata-filtered vector search.
- Hybrid ranking: 72% vector score + 28% normalized keyword overlap.
- Retrieval contract preserves document/source/url/published-at/symbol/category metadata for later citations.
- `/knowledge/index` and `/knowledge/retrieve` AI APIs.
- `TSEAI.Knowledge.Worker` read-only SQL ingestion worker with configurable source adapters.
- Docker integration and environment configuration.
- Tests for Persian normalization, stable chunking and filtered hybrid retrieval.

## Boundary
Sprint 9 retrieves evidence only. It does **not** generate final conversational answers, choose between Symbol/Filter/Knowledge tools, or compose multi-tool answers. Those belong to Sprint 10.

## Production note
The deterministic hashing embedding is an offline-safe fallback, not the target semantic model. For production, configure `EMBEDDING_BASE_URL` to a local multilingual embedding service (for example a locally hosted multilingual-e5 model). Re-index the Qdrant collection if the embedding model or dimension changes.

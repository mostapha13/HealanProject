# TSEAI Sprint 9 Manifest

Baseline: `TSEAI.Sprint8.AlertEngine`

Added:
- `AI/tseai-ai/app/knowledge/*`
- AI endpoints `/knowledge/index` and `/knowledge/retrieve`
- `Backend/Knowledge/src/TSEAI.Knowledge.Worker/*`
- Docker `knowledge-worker`
- embedding/Qdrant environment configuration
- `docs/SPRINT9.md`
- `docs/knowledge-source-contract.md`
- `tests/knowledge-rag-cases.json`
- `scripts/validate-sprint9.py`

Acceptance target: canonical ingestion -> Persian normalize -> stable chunks -> embeddings -> Qdrant -> hybrid retrieval with source metadata and filters.

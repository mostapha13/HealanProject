# TSEAI Sprint 10 Manifest

Baseline: `TSEAI.Sprint9.KnowledgeRAG`

Added:
- `Application/Chat`: allow-listed orchestration contracts and `ChatOrchestrator`
- `Infrastructure/Chat`: AI planner and Knowledge RAG HTTP adapters
- AI `/chat/plan` deterministic intent planner
- unified `/api/chat/ask` routing across Market, Filter, Knowledge and Hybrid paths
- citations and per-tool trace in chat response
- chat planner tests
- `docs/SPRINT10.md`
- `scripts/validate-sprint10.py`

Acceptance target: one safe chat entry point that selects only approved TSEAI capabilities and remains deterministic/auditable at the execution boundary.

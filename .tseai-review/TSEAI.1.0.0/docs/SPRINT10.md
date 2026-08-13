# Sprint 10 — Chat Orchestrator

## Goal
Turn TSEAI capabilities into a single auditable chat entry point without allowing the LLM to directly execute arbitrary tools.

## Architecture
`POST /api/chat/ask` -> quota -> allow-listed intent plan -> .NET validation/orchestration -> Market / Filter / Knowledge -> normalized response + citations + tool trace.

### Supported intents
- `MarketSymbol`: current structured symbol snapshot from Redis.
- `MarketFilter`: existing deterministic TSETMC-compatible conversational filter pipeline.
- `Knowledge`: Sprint 9 hybrid RAG retrieval with source metadata.
- `Hybrid`: structured symbol data + RAG evidence in the same answer.
- `Clarification`: fail-closed when a required symbol/input is missing.

## Security boundary
The AI engine only returns an intent plan. It cannot provide URLs, SQL, executable code, service names, or arbitrary tool arguments. .NET owns authorization, quota, tool selection and execution.

## Response contract
Every successful response includes `intent`, `confidence`, `answer`, optional structured `market`/`filter`/`knowledge`, `citations`, and an auditable per-tool `trace`.

## Out of scope
Generative synthesis using an unrestricted external LLM, long-term chat memory, recommendation/advice engine, portfolio actions and order placement.

# TSEAI — Enterprise Release Candidate

TSEAI is an AI Market Intelligence Platform for the Tehran capital market. Version `1.0.0-rc.31` includes the cumulative product through Sprint 40 plus enterprise hardening, adapters for the assessed local SQL AI schema, local Persian-capable Qwen inference/embeddings, a 20-user capacity gate, AFTA evaluation readiness and fail-closed GA promotion.

## Sprint 0 goals

- Independent TSEAI Identity bounded context and service skeleton.
- Main TSEAI API skeleton using Domain/Application/Infrastructure/API layering.
- Dedicated Market Runtime worker skeleton for live market snapshot ingestion.
- Notification service skeleton for future filter alerts.
- Python AI service skeleton for RAG, intent routing and natural-language filter planning.
- React/Vite web shell.
- Nginx API gateway.
- SQL Server, Redis, RabbitMQ and Qdrant infrastructure.
- End-to-end Docker-first deployment topology.
- External Market SQL Server is treated as read-only and is not containerized.

## Important architectural constraints

1. Identity is independent from Healan. TSEAI has its own users, roles, permissions, OTP policies and identity database.
2. Healan is only a reference for proven patterns such as layered .NET services, OTP flow, role/permission seeding and Docker conventions.
3. TSETMC field names/semantics are required only inside the Filter Engine adapter. Other modules use TSEAI canonical domain models.
4. Market source database is read-only. New indexes/views are a last-resort optimization after profiling.
5. Raw money values remain IRR internally. User-facing formatting will convert large amounts to million/billion IRR.
6. Trading sessions are configuration-driven and never hard-coded.

## Run

1. Copy `.env.example` to `.env` and change all secrets.
2. Configure `MARKET_DB_CONNECTION_STRING` for the external read-only market database using the aliases documented in `docs/MARKET-SQL-MAPPING.md`.
3. Configure `SQL_AI_CONNECTION_STRING` as a read-only connection to the continuously refreshed SQL AI database used by the canonical data boundary.
4. Run:

```bash
docker compose up -d --build
```

Gateway: `http://localhost:8080`

Useful health endpoints:

- `GET /api/health`
- `GET /identity/health`
- `GET /notifications/health`

The AI service is intentionally private and is not exposed by the production gateway.

RabbitMQ management UI: `http://localhost:15672`
Qdrant API: `http://localhost:6333`

## Current status

See `docs/STATUS.md` for the exact cumulative sprint status in this package.


## Sprint 1
Independent mobile OTP identity, roles/permissions and configurable daily question quota are implemented. See `docs/SPRINT1.md`.


## Sprint 2
Read-only market runtime, configurable session scheduling and shared Redis market snapshot are implemented.


## Sprint 3
Safe TSETMC simple-expression parser, AST, validator and evaluator are implemented over the Redis market snapshot.


## Sprint 4
TSETMC import/export, Persian explanation, dependency analysis and round-trip conformance suite are implemented.


## Sprint 5
Persian natural-language filter planning is connected to the deterministic TSETMC validation/execution pipeline and exposed through the chat UI/API.


## Sprint 6
Stateful conversational filter editing is implemented. Each conversation keeps a transient Redis-backed filter state with AST-safe add/remove/replace operations, numbered conditions, Undo/Redo, per-conversation locking and deterministic revalidation before execution. See `docs/SPRINT6.md`.


## Sprint 7
Durable per-user saved filters, favorites, SQL version history, restore, duplicate, soft-delete, configurable saved-filter limits and conversation reload are implemented. See `docs/SPRINT7.md`.


## Sprint 8
Saved-filter alerts are live: incremental changed-symbol evaluation, false→true edge triggers, cooldown, version pinning/follow-latest, persistent event history, transactional outbox, RabbitMQ delivery and authenticated SignalR notifications. See `docs/SPRINT8.md`.


## Sprint 13
Canonical Data Foundation is implemented over the continuously refreshed SQL AI landing database. Configure `SQL_AI_CONNECTION_STRING`; application code consumes canonical contracts rather than legacy column names. See `docs/SPRINT13.md`.


## Sprint 14
Deterministic Persian/Jalali temporal resolution is integrated into Chat. The engine understands relative dates, numeric Jalali/Gregorian dates, Persian month names and common ranges in Tehran market time, and fails closed when current market data is requested for unavailable historical/future dates. See `docs/SPRINT14.md`.


## Sprint 9
Organizational/site knowledge ingestion, Persian normalization, Qdrant retrieval and citations.


## Sprint 10
Unified Market / Filter / RAG / Hybrid orchestration with fail-closed clarification.


## Sprint 11
Operations/audit/incident control plane plus bounded Reflection, Tool Policy and optional MCP boundary.


## Sprint 12
Production Compose, security gates, migration ledger, backup/restore and release validation.


## Sprint 15
Persian Entity & Instrument Resolver validates AI planner entity hints against SQL AI before structured market execution. It supports Instrument, MarketIndex, Company, TsePerson, RegionHall and FinancialInstitution entities, normalizes Persian/Arabic variants, fails closed on ambiguity, and uses canonical `InsCode` for current market lookup. See `docs/SPRINT15.md`.


## Sprint 16

Data Quality & Freshness Engine: deterministic market-snapshot validation, canonical source health checks, fail-closed Chat enforcement, filter quality rejection accounting, and admin diagnostics. See `docs/SPRINT16.md`.


## Sprint 20
Chat-Integrated TSETMC Filter Engine is available in `1.0.0-rc.9`: direct TSETMC DSL and explicit Persian filter requests are validated and executed inside Chat.


## Sprint 21
Conversational Filter Editing is available in `1.0.0-rc.10`: current filters can be edited in Chat with add/remove/replace/clear/undo/redo/show/explain/execute while the deterministic AST validator remains authoritative.


## Sprint 22
Filter + Temporal Integration is available in `1.0.0-rc.11`: filter execution uses the canonical Persian Temporal Resolver. Current-day filters execute on the live/current snapshot; historical, future and non-current ranges fail closed until `MarketDailyHistory` is connected. Temporal phrases are execution scope and are not persisted inside the TSETMC AST/DSL.


## Sprint 24
Knowledge Ingestion & Content Intelligence is available in `1.0.0-rc.13`: Phase-1 Content/FAQ/CompanyState/Download metadata are ingested through a read-only schema-aware streaming worker, sanitized/normalized/routed before Qdrant, enriched with conservative entity/topic metadata and deduplicated by content hash. See `docs/SPRINT24.md`.


## Sprint 28
Conversational Context Intelligence preserves authoritative entity referents and route metadata across a conversation. Follow-ups reuse referents but always re-read market facts through current Structured Tools and Quality Gate. Comparison and explicit correction are deterministic. See `docs/SPRINT28.md`.

## Sprint 29
Temporal Conversation Context adds deterministic date anchoring across turns (`قبلش/بعدش/همون روز`), explicit two-date comparison recognition, missing-anchor fail-closed behavior, and real-clock rebasing so contextual references cannot bypass historical/future market guards.


## Current intelligence baseline — Sprint 35

Version `1.0.0-rc.24` includes Answer Validation/Hallucination Guard, Persian Financial Answer Composer, Rich Chat UI, AI Admin/Semantic Registry, and Golden Question Dataset v1 (320 cases). Sprint 36 is the next evaluation/release-quality stage.

## Final Candidate / GA promotion
Implementation and static enterprise gates are complete at `1.0.0-rc.31`. Live production certification remains fail-closed. Run `scripts/production-e2e.sh` (or `.cmd`) on the target environment. Only a fresh `GA_READY` report authorizes `v1.0.0`.

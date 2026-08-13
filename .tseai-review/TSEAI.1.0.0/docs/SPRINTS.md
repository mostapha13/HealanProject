# TSEAI Delivery Roadmap

## Sprint 0 — Foundation & Docker
- Repository layout and layer boundaries.
- Independent Identity service skeleton.
- Main API, Market Runtime, Notification, Python AI and Web skeletons.
- Nginx gateway, SQL Server, Redis, RabbitMQ, Qdrant.
- Docker-first local topology and architecture ADRs.

## Sprint 1 — Identity, OTP, Roles, Permissions & Quotas
- Independent user store.
- Mobile OTP request/verify with resend/attempt/expiry policies.
- JWT/OIDC + refresh/session revocation.
- Role/permission seeds.
- Guest daily question quota default 5; logged-in default 50.
- Limits stored in admin-editable base settings, not hard-coded.
- Distributed atomic counters in Redis + durable usage audit in SQL.

## Sprint 2 — Market Data Runtime V1
- Instrument/reference cache.
- SymbolCode <-> insCode mapping adapter.
- Configurable TradingCalendar/TradingSession, including future schedule changes.
- Independent readers for trade/current-price, client type and order book tables.
- Incremental polling and changed-symbol merge.
- Redis hot snapshot and data freshness metadata.
- Money formatter: raw IRR + million/billion IRR display.

## Sprint 3 — TSETMC Simple Filter Parser & Canonical AST
- Field registry for the official TSETMC filter fields required by V1.
- Lexer/parser for arithmetic, comparison, boolean and safe string operations.
- AST validator with type/unit checking.
- No arbitrary JavaScript execution.

## Sprint 4 — Filter Evaluator & TSETMC Conformance
- In-memory evaluator over current market snapshot.
- TSETMC exporter from canonical AST.
- Import TSETMC simple expressions.
- Conformance corpus comparing expected matched symbol sets.
- Explain filter in Persian.

## Sprint 5 — Natural Language Filter Builder
- Persian query normalization and financial number/unit parser.
- Natural-language -> structured Filter Intent -> canonical AST.
- Deterministic validation before execution.
- TSETMC-compatible generated filter output.

## Sprint 6 — Conversational Filter Editing ✅
- Redis-backed per-conversation filter state.
- Add/remove/replace/change-value/clear/show operations.
- Version cursor with Undo/Redo.
- Distributed per-conversation lock to prevent double-submit races.
- Deterministic validation after every edit.
- Numbered active-filter conditions and conversational UI presentation.
- Ambiguous/unsupported edits fail closed.

## Sprint 7 — Saved Filters & Versioning ✅
- Save/name/favorite filters.
- Version history and restore.
- Import/export TSETMC expressions.
- Per-user configurable saved-filter limits.

## Sprint 8 — Alerts ✅
- Alert rules attached to saved filters, latest-version follow or pinned version.
- Changed-symbol Redis Stream evaluation with abandoned-pending reclaim.
- Edge-trigger (`false -> true`), version/day-aware state and cooldown.
- Transactional SQL outbox + RabbitMQ publisher confirms.
- Authenticated SignalR delivery with Redis backplane and EventId deduplication.
- Persistent alert history and configurable per-user alert limits.

## Sprint 9 — Knowledge/RAG Foundation
- Source adapters for notices, managers, options and other site tables.
- Canonical knowledge document schema.
- Persian normalization, chunking, embeddings, Qdrant.
- Hybrid keyword/vector retrieval with metadata filters.

## Sprint 10 — Chat Orchestrator ✅
- Allow-listed intent planner for Knowledge / Symbol / Filter / Hybrid / Clarification.
- .NET-owned tool execution and authorization boundary.
- Unified `/api/chat/ask` orchestration over Market, deterministic Filter Engine and Sprint 9 RAG.
- Multi-tool combined responses with citations and per-tool trace.
- Fail-closed clarification when required tool inputs are missing.

## Sprint 11 — Admin & Operations
- System/base settings UI.
- Trading sessions and quotas.
- User/role/permission administration.
- Usage dashboard, AI/filter failure analytics, audit.

## Sprint 12 — Hardening & Production Release
- Load/concurrency tests.
- Horizontal scale tests.
- Failure/retry policies, observability and structured logs.
- Security review, backups, secrets/certificates, rate limiting.
- Docker Compose production profile and deployment guide.

## Later roadmap
- TSETMC programming-mode compatibility (`function`, loops, custom fields) through a sandboxed interpreter, not browser eval.
- History `[ih]` filters and statistics `[is*]` expansion.
- Technical indicators/backtesting.
- Subscription plans and richer notification channels.


## Sprint 13 — Canonical Data Foundation ✅
- Freeze Phase-1 SQL AI landing contract.
- Canonical application models independent of legacy source names.
- Read-only `ICanonicalDataGateway` over SQL AI.
- `InstrumentID` canonical identity and `InsCode` bridge key.
- Explicit money-unit-to-IRR normalization; no magnitude guessing.
- Admin-only source/status/market diagnostics.
- Preserve the user-approved migration queries and data-source contract in project docs.

## Planned Sprints 14-40
See `docs/ROADMAP-POST-RC.md`. Sprints 14 and 15 are implemented. Chat-integrated filter work is planned in Sprints 20-23, with temporal/filter integration in Sprint 22.


## Sprint 14 — Persian Temporal Intelligence Engine ✅
- Deterministic Persian/Jalali date parser shared by Chat/Tool/Filter layers.
- Persian/Arabic digit and character normalization.
- Relative dates: today/tomorrow/day-after/yesterday/day-before plus numeric/Persian word offsets.
- Exact Jalali/Gregorian numeric dates and Persian month-name dates.
- Explicit/named day/week/month/year ranges.
- `Asia/Tehran` reference timezone.
- Thursday/Friday weekly market-closure classification; official holiday feed intentionally not guessed.
- Chat fail-closed guard prevents historical/future market questions from silently using today's snapshot.
- Zero-package .NET temporal smoke test wired into the release gate.


## Sprint 15 — Persian Entity & Instrument Resolver ✅
- Deterministic Persian/Arabic entity normalization and bounded candidate scoring.
- SQL-AI-backed Instrument/Index/Company/Person/RegionHall/FinancialInstitution candidates.
- `InstrumentID`, `InsCode`, ISIN, exact symbol and company-name aliases.
- Ambiguity/no-match fail closed; no LLM-declared Instrument identity.
- Chat `entity.resolve` trust boundary before current market tool execution.
- Multi-word entity hints such as `بانک ملت`, `ایران خودرو`, `شاخص کل`.
- Entity resolution smoke tests wired into release gates.


## Sprint 16 — Data Quality & Freshness Engine ✅
- deterministic freshness and consistency rules
- canonical source quality diagnostics
- Chat fail-closed quality gate
- filter `QualityRejected` enforcement
- admin diagnostics and smoke/release gates

# TSEAI Architecture Baseline

## Bounded contexts / deployable services

### TSEAI.Identity
Independent identity service and data store. Sprint 1 adds mobile OTP, ASP.NET Core Identity, OIDC/JWT, refresh sessions, roles/permissions, login audit and seeds. No Healan users/roles are shared.

### TSEAI.Api
Main product backend. It remains modular and owns Chat, Conversation, Usage/Quota, Saved Filters, Knowledge orchestration, Symbol query facade, Settings and Audit modules.

### TSEAI.MarketRuntime
Single-purpose market ingestion/runtime process. Reads the external market SQL Server with read-only credentials, respects configurable trading sessions, builds/merges current snapshots and publishes hot state to Redis. It must not poll static instrument metadata every second.

### TSEAI.AI
Python AI plane. It will own Persian normalization, RAG retrieval, intent/tool planning and natural-language-to-filter-plan generation. It never directly executes arbitrary SQL or JavaScript filter code.

### TSEAI.Notification
Async alert delivery boundary. RabbitMQ is the event transport. Alert evaluation itself belongs close to the Market/Filter runtime; delivery belongs here.

## Data planes

- `TSEAI_Identity`: users, roles, permissions, OTP/session data.
- `TSEAI_App`: conversations, quota usage/audit, saved filters, settings, alerts, RAG source metadata.
- External Market SQL Server: read-only source of instrument/trading/client-type/order-book/history data.
- Redis: hot market snapshot, distributed counters/quotas, cache, locks/leader lease.
- Qdrant: vector index for knowledge RAG.
- RabbitMQ: alert/event transport.

## Filter Engine invariant

TSETMC compatibility exists only at the Filter boundary:

Natural Language -> Canonical Filter AST <- TSETMC DSL
                              |
                              v
                         Safe Evaluator
                              |
                              +--> TSETMC exporter

Other modules use canonical TSEAI field names and models.

## Scaling

- Identity/API/AI/Notification: stateless containers, horizontally scalable.
- MarketRuntime: one active poller per market source by distributed leader lease; standby replicas are possible.
- Redis/SQL/Qdrant/RabbitMQ are shared state/infrastructure and should be externalized/clustered in production as load grows.

## Security baseline

- No real secrets in repository.
- Market DB account is read-only.
- Filter engine must parse to an allow-listed AST; never `eval` user JavaScript.
- Anonymous quota identity is advisory and cannot be made tamper-proof without login.
- Admin settings and usage APIs require explicit permissions.

## Sprint 8 alert pipeline

```text
Read-only Market SQL
        │
        ▼
MarketRuntime readers
        │  merge only changed Current / ClientType / OrderBook data
        ▼
Redis Market Snapshot
        │
        ├── Redis Stream: market change batches
        ▼
TSEAI.Alert.Worker (N replicas)
        │  consumer group + abandoned pending reclaim
        │  Saved Filter AST + dependency-aware deterministic evaluation
        │  false → true + cooldown
        ▼
Application SQL transaction
  AlertEvent + AlertOutbox
        │
        ▼
Outbox Publisher ── publisher confirm ──► RabbitMQ
                                           │
                                           ▼
                                  Notification API
                                           │
                                  SignalR + Redis backplane
                                           │
                                           ▼
                                       User Web UI
```

The alert path never calls the AI planner. Natural-language interpretation ends when a Saved Filter is created/versioned; live evaluation always uses the validated TSETMC-compatible AST.

## Sprint 13 — Canonical SQL AI Data Boundary

The continuously refreshed SQL AI database is a landing/read-model source, not a domain model. `TSEAI.Application.Data.Canonical` defines stable contracts and Infrastructure maps legacy landing columns through `SqlAiCanonicalDataGateway`. Later AI capabilities must use this boundary instead of embedding legacy SQL/column semantics into prompts or planners.

```text
SQL AI landing tables
       ↓ read-only
SqlAiCanonicalDataGateway
       ↓
Canonical contracts
       ↓
Temporal / Entity / Quality / Tool layers (Sprints 14+)
```

`InstrumentID` is the primary canonical identity when present; `InsCode` is retained as the bridge to market-source tables. Money conversion is explicit and deterministic to IRR.


## Sprint 14 — Persian Temporal Intelligence Boundary

All user-facing temporal language is resolved once before market tool execution. Individual tools are not allowed to reinterpret Persian dates independently.

```text
Persian question
      ↓
PersianTemporalNormalizer
      ↓
PersianTemporalResolver
      ↓
TemporalResolution (Jalali + Gregorian + Tehran market context)
      ↓
Intent/Tool/Filter layers
```

For current market tools, a resolved date other than the Tehran reference day causes a fail-closed response until a historical market source is connected. Future dates are never presented as factual market data. `MarketDayKind` only makes deterministic weekly-closure claims for Thursday/Friday; official holidays require an authoritative feed.


## Sprint 15 — Persian Entity Resolution Boundary

The planner may identify a phrase that appears to name a market entity, but it is not an authority for identity. SQL AI is the authority.

```text
User question
     ↓
Temporal resolution / safe intent planning
     ↓ entity hint only
PersianEntityNormalizer
     ↓
SqlAiEntityCandidateSource (read-only, parameterized)
     ↓
PersianEntityResolver
     ├─ Resolved → canonical ID / InstrumentID / InsCode / Symbol
     ├─ Ambiguous → clarification
     └─ NoMatch → fail closed
     ↓
Structured Market Tool / later RAG & Context layers
```

For Market/Hybrid Chat only `Instrument` and `MarketIndex` are accepted. `InsCode` is preferred when reading the Redis market snapshot. Market indexes are recognized but are not silently treated as equities; the dedicated index tool remains a later Structured Tools capability.

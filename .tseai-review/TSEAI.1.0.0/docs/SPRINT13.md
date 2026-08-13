# Sprint 13 — Canonical Data Foundation

## Goal
Create a stable, typed, read-only canonical boundary over the user-provided SQL AI landing database so later Chat/Tool/Filter/RAG sprints do not depend on legacy table or column names.

## Phase-1 landing sources
The catalog recognizes:

- Instrument
- Cashmarket
- OrderBookCurrent
- ClientType
- Marketsummary
- IndexLastLive
- Companystate
- ContentType
- Content
- FAQ
- Talar
- TalarInfo
- Nahad_Mali_Type
- Nahad_Mali
- Company
- TsePerson
- EDeliveryCategory (optional until landing copy is verified)
- EDeliveryObject (optional until landing copy is verified)

The current migration/query baseline is preserved in `docs/data/TSEAI.DataMigrationQueries.v22.md` and the canonical source contract in `docs/data/TSEAI.DataSourceContract.v1.md`.

## Implemented

### 1. Canonical contracts
`TSEAI.Application.Data.Canonical` now owns canonical models for:
- instrument identity/reference data;
- current cash-market snapshot;
- five-level order book;
- individual/legal client type;
- market summary;
- market indexes;
- FAQ/content/reference concepts needed by later sprints.

### 2. Explicit source catalog
`CanonicalSourceCatalog` declares the landing tables, source mode and business keys. This is the single code-level registry for Phase-1 SQL AI sources.

### 3. Read-only SQL AI gateway
`SqlAiCanonicalDataGateway`:
- uses `ApplicationIntent=ReadOnly`;
- resolves exact instrument identifiers without LLM involvement;
- maps legacy source columns to canonical names;
- exposes current market, order book, client type, market summary and indexes;
- reports table existence, row counts and latest `SourceCollectedAt` for diagnostics;
- does not modify SQL AI.

### 4. Money normalization
`CanonicalMoneyNormalizer` converts only from an explicitly configured source unit to IRR. Supported contracts are `Irr`, `Toman`, `ThousandIrr` and `MillionIrr`. There is no value-magnitude heuristic.

Default for current CashMarket landing data is `Irr`, configurable with:

```text
SQL_AI_CASHMARKET_MONEY_UNIT=Irr
```

### 5. Admin-only diagnostics
Operations users can inspect the boundary through:

```text
GET /api/admin/canonical/status
GET /api/admin/canonical/instrument/{key}
GET /api/admin/canonical/market/{instrumentId}
GET /api/admin/canonical/summary?marketId=20
```

These endpoints are diagnostic and intentionally not the final Chat Tool API. Structured Chat capabilities arrive in later sprints.

### 6. Deployment configuration
Platform API accepts:

```text
ConnectionStrings__SqlAi
SqlAi__CashMarketMoneyUnit
```

The example Compose configuration can reach a host-side SQL Server through `host.docker.internal` and should use a read-only SQL login in production.

## Non-goals
- Persian temporal interpretation (Sprint 14).
- fuzzy/entity alias resolution (Sprint 15).
- data-quality/freshness decision engine (Sprint 16).
- exposing these queries directly as Chat tools (Sprint 17).
- historical `[ih]` support; source data is still pending.
- direct CompanyOfficer/financial-statement/derivative/market-maker sources; these remain extension points.

## Security invariants
- SQL AI connection is read-only by contract and `ApplicationIntent=ReadOnly` is enforced by the gateway.
- Dynamic source names come only from `CanonicalSourceCatalog`; arbitrary user-supplied table names are never accepted.
- All lookup values are parameterized.
- The LLM does not receive SQL credentials and cannot execute arbitrary SQL.

## Definition of Done
- Canonical contracts compile structurally.
- Source catalog covers the frozen Phase-1 baseline.
- Infrastructure mapping contains no arbitrary SQL execution path.
- Admin diagnostics are permission-protected.
- Static Sprint 13 validator passes.
- Existing Sprint 7-12 and AI validators continue to pass.
- Runtime `.NET build/test` remains a target-host gate when .NET SDK is unavailable in the packaging environment.

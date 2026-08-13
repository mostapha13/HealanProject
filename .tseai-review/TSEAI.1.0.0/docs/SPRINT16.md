# Sprint 16 — Data Quality & Freshness Engine

Version: `1.0.0-rc.5`
Baseline: Sprint 15 (`1.0.0-rc.4`)

## Delivered
- Deterministic `IDataQualityService`.
- Market snapshot freshness policy using `SnapshotUpdatedAtUtc`.
- Canonical SQL AI source health/freshness assessment across the Phase-1 source catalog.
- Price, numeric, ClientType and OrderBook consistency checks.
- Fail-closed Chat quality boundary before structured facts are composed into answers.
- Filter execution rejects stale/invalid snapshots and exposes `QualityRejected`.
- Admin diagnostics: `/api/admin/data-quality/sources` and `/api/admin/data-quality/market/{key}`.
- Environment-configurable freshness thresholds.
- Sprint 16 static validator + .NET smoke-test project.

## Status semantics
`Valid`, `Warning`, `Stale`, `Invalid`, `Unknown`.

## Explicit non-goals
- No source mutation/repair.
- No inference of official exchange holidays.
- No assumption that `SourceCollectedAt` is the business/event date.
- No historical quality backfill; `MarketDailyHistory` is still pending.

# ADR 0008 — Data Quality & Freshness Boundary

Status: Accepted — Sprint 16

## Decision
TSEAI must validate structured market facts before they can be used by Chat or filter execution. The quality engine is deterministic and independent from the LLM.

Two levels are evaluated:
1. **Market snapshot quality** — freshness of the Redis snapshot plus deterministic consistency rules for price, volume, client type, and order book facts.
2. **Canonical source quality** — table existence, row presence, collection timestamp availability, and policy-based freshness for the 18 SQL AI sources.

`SourceCollectedAt` remains a **collection timestamp**, not an event/effective date. The current migration jobs generate it with SQL `GETDATE()`; unspecified values are interpreted as Tehran wall-clock time for freshness diagnostics.

## Fail-closed policy
- `Invalid` and `Stale`: structured Chat answer is blocked.
- `Unknown`: blocked when freshness cannot be proved for the live market snapshot.
- `Warning`: answer may continue, but the warning is exposed.
- Filter execution excludes unusable snapshots and reports `QualityRejected`.

## Market time
Default live market window: Saturday-Wednesday, 08:30-13:30 Asia/Tehran. Thursday/Friday are weekly closed days. Official/exceptional holiday knowledge is not invented; it requires a future authoritative calendar source.

## No silent repair
TSEAI never mutates source facts to make validation pass. It returns quality metadata/issues and uses the source value only when policy permits.

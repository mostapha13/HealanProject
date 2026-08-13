# TSEAI Knowledge Ingestion Policy

SQL Server is the system of record. Redis stores only restart-safe operational checkpoints and Qdrant stores derived, rebuildable vectors.

## Source classes

| Data class | Change mode | Capture | Typical cadence | Vector policy |
|---|---|---|---:|---|
| live trades/order book | snapshot/upsert | dedicated market runtime | 1 second | never |
| intraday reference data | upsert | watermark, then SQL Change Tracking | 1-15 minutes | changed text only when it has semantic text |
| organization/manager assignment | slowly changing dimension 2 | watermark | 5-60 minutes | current projection or all versions |
| news/notices | append | watermark | 1-5 minutes | new only, unless corrections are allowed |
| FAQ/content pages | upsert | watermark | 10-60 minutes | changed text only |
| static dictionaries | full reconciliation | daily | 24 hours | never or changed text only |

## Required query contract

Every configured source query is read-only and returns `SourceId`, `Title`, and `Body`. It should also return `WatermarkAt`; deletion-aware sources return `IsDeleted`. SCD2 sources return `IsCurrent`, `EffectiveFrom`, `EffectiveTo`, and optionally `Version`.

The worker stores a compound `(WatermarkAt, SourceId)` checkpoint only after every batch in that source run has been indexed successfully. A configurable overlap window intentionally replays boundary rows; the AI service's semantic `content_hash` makes this idempotent and avoids embedding unchanged text.

For `AllVersions`, the vector document id includes `Version` or `EffectiveFrom`. For `CurrentProjection`, use a stable business key such as `organizationId:roleId` as `SourceId`, so replacing the current manager updates the same vector document. Historical assignments remain authoritative in SQL and can additionally be indexed with a separate `AllVersions` source.

The Phase-1 adapter for `dbo.TsePerson` uses a hash of `TsePersonCateryId + Role` as that stable business key and selects the newest `ContentId` per role. When the person assigned to that role changes, the AI store archives the previous vector payload with `is_current=false` and an `effective_to` timestamp before indexing the new current assignment. Queries default to current records; Persian terms such as «سابق»، «قبلی» and «پیشین» switch retrieval to historical records.

## Safety rules

- A checkpoint is never advanced before Qdrant accepts the batch.
- Tombstones remove derived vectors. A physical SQL deletion without a tombstone cannot be inferred from a watermark scan; such tables must expose soft-delete/tombstone rows or a deletion outbox. Daily full reconciliation repairs missed inserts/updates but is not a substitute for deletion events.
- `ChangeTracking` and `CDC` are rejected until explicitly provisioned in SQL Server; silent fallback is forbidden.
- Embeddings are recomputed only for new or semantically changed documents. Numeric market ticks are not embedded.
- Each source has its own cadence and can define a freshness SLA.

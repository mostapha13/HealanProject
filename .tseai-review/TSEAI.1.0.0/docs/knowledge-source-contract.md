# Knowledge Source Contract — Sprint 9

Every configured SQL source is read-only and MUST be a single `SELECT` statement. It must project these aliases:

- `SourceId` (required): stable id in the source system.
- `Title` (required): human-readable title.
- `Body` (required): complete textual content before chunking.
- `Url` (optional): canonical source URL.
- `Symbol` (optional): normalized symbol when the document is symbol-specific.
- `Category` (optional): source-specific semantic category.
- `PublishedAt` (optional): publication timestamp.

Example notice adapter:

```sql
SELECT CAST(Id AS nvarchar(100)) AS SourceId,
       Title,
       Body,
       SourceUrl AS Url,
       Symbol,
       N'notice' AS Category,
       PublishedAt
FROM dbo.MarketNotices
WHERE IsDeleted = 0
```

Example managers adapter:

```sql
SELECT CAST(Id AS nvarchar(100)) AS SourceId,
       CONCAT(N'مدیران ', CompanyName) AS Title,
       Description AS Body,
       SourceUrl AS Url,
       Symbol,
       N'manager' AS Category,
       UpdatedAt AS PublishedAt
FROM dbo.CompanyManagers
WHERE IsActive = 1
```

Example options/reference adapter:

```sql
SELECT CAST(InstrumentId AS nvarchar(100)) AS SourceId,
       DisplayTitle AS Title,
       Description AS Body,
       SourceUrl AS Url,
       UnderlyingSymbol AS Symbol,
       N'option' AS Category,
       UpdatedAt AS PublishedAt
FROM dbo.OptionReference
WHERE IsActive = 1
```

Do not point the worker at arbitrary user-authored SQL. Source queries are deployment/admin configuration and the runtime rejects non-SELECT and multi-statement queries.

## Sprint 24 extensions

The Sprint-9 aliases remain backward compatible. A source may additionally project:

- `ContentTypeId`, `LanguageId`, `ContentStatusId`, `CategoryId`, `ResourceCode`
- `IsDeleted` (tombstone)
- `LastModifiedAt`, `SourceCollectedAt`, `WatermarkAt`
- `Symbols`, `Companies`, `Persons`, `Topics` (pipe/comma/semicolon separated or metadata arrays)
- `MetadataJson` (optional JSON object)

If `SupportsSince=true`, the configured SELECT may use the single `@Since` parameter. The worker supplies it as `datetime2` and commits its in-memory high-watermark only after the source pass completes successfully.

For the Phase-1 SQL AI database, Sprint 24 can auto-discover `Content`, `FAQ`, `Companystate` and `EDeliveryObject`; custom source queries remain available for additional sources.

See `docs/knowledge-ingestion-contract-v2.md` for routing, sanitization, deduplication and trust rules.

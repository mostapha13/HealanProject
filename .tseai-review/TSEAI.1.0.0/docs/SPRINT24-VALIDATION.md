# Sprint 24 Validation

Required checks:
- AI knowledge unit tests including sanitizer/routing/tombstone/dedup/metadata filters.
- Phase-1 worker source discovery is schema-aware and read-only.
- Worker streams all batches and enforces maximum source-run size.
- Qdrant content hashes suppress unchanged embeddings.
- ContentType 3/unknown types fail closed.
- Download Center remains page-link-only.
- exact-symbol enrichment never fuzzy-guesses entities.
- cumulative Sprint 7..24 validators remain green.

Runtime gates retained for a .NET/Docker capable environment:
- `dotnet restore/build/test`
- live SQL-AI source discovery against the actual Phase-1 schema
- Qdrant full-ingestion smoke and restart/idempotency smoke
- Docker production E2E

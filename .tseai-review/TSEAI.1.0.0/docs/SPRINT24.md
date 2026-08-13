# Sprint 24 — Knowledge Ingestion & Content Intelligence

Status: COMPLETE
Version: `1.0.0-rc.13`
Baseline: Sprint 23 / `1.0.0-rc.12`

## Delivered
- Phase-1 SQL-AI auto-discovery for Content, FAQ, CompanyState and Download Center metadata.
- Streaming batch ingestion fixes the Sprint-9 first-batch starvation issue.
- Read-only SQL connection and SELECT-only custom query guard.
- HTML-to-plain-text sanitizer with executable/non-content tag removal.
- Persian normalization plus Persian/Arabic digit normalization for search.
- CMS ContentType routing with unknown types fail-closed.
- Explicit `rag / hybrid / ignore` route metadata and authority classification.
- FAQ AnswerRaw -> sanitized answer text.
- CompanyState reason text metadata (`reason_count`) and Hybrid route.
- Download Center metadata ingestion in page-link-only mode; no arbitrary file fetch.
- Deterministic topic tagging for known market topics.
- Exact Instrument-symbol enrichment, with company name attached through resolved symbol only.
- SHA-256 ContentHash and batch Qdrant hash lookup for unchanged-document suppression.
- Tombstone deletion for `IsDeleted` and routing changes to ignored content.
- Qdrant payload indexes for core routing/filter fields.
- Retrieval can already constrain route/content type/language; Sprint 25 will implement advanced hybrid/date/entity ranking.

## Non-goals / fail-closed decisions
- No numeric fact is promoted from RAG over canonical SQL facts.
- No arbitrary remote Download Center file is fetched.
- No guessed symbol/company/person extraction.
- Unknown CMS ContentType is not indexed.
- ContentStatusId semantics are preserved as metadata; no status id is guessed as "published" without a source contract.

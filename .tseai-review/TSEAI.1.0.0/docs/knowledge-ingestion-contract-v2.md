# Knowledge Ingestion Contract v2 — Sprint 24

## Purpose
Convert Phase-1 SQL-AI textual sources into safe, traceable Qdrant knowledge without turning descriptive text into numeric source-of-truth.

## Sources
The worker auto-discovers, read-only, when present:
- `dbo.Content` → `cms_content`
- `dbo.FAQ` → `faq`
- `dbo.Companystate` → `company_state`
- `dbo.EDeliveryObject` → `download_center`

Discovery uses `sys.columns`. Optional legacy columns are never blindly referenced. User-configured SELECT-only sources are still supported and override auto sources with the same name.

## Pipeline
`SQL AI -> streaming batches -> exact symbol enrichment -> /knowledge/index -> HTML sanitize -> Persian normalize -> routing -> content hash -> chunk -> embed -> Qdrant`

### HTML safety
- `script`, `style`, `noscript`, `svg`, `canvas`, `template` content is discarded.
- block elements become deterministic line breaks.
- Raw HTML remains in SQL AI; Qdrant stores plain normalized text only.

### CMS routing
| ContentTypeId | Route | Authority |
|---|---|---|
| 1 News/Notice | RAG | descriptive_only |
| 2 Content | RAG | descriptive_only |
| 3 Banner | Ignore | none |
| 4 Video with text | RAG | descriptive_only |
| 5 Download center | Hybrid | metadata/descriptive only |
| 6..21 Structured CMS families | Hybrid | descriptive_only; numeric facts remain SQL-authoritative |
| 22 Images | Ignore unless meaningful text metadata exists | metadata_only |
| 23 Multimedia bulletin | RAG | descriptive_only |
| 24 Brand book | RAG | descriptive_only |
| 25 Manager panel | Hybrid | descriptive_only |
| 26 Company state change | Hybrid | descriptive_only |
| Unknown | Ignore / fail-closed | none |

FAQ is RAG-first. Company-state reasons and Download Center are Hybrid. Download Center is `page_link_only`: Sprint 24 never fetches or ingests arbitrary remote files/URLs.

## Provenance metadata
Each indexed document/chunk can carry:
- `source_type`, `source_id`, `published_at`, page `url`
- `content_type_id`, `language_id`, `content_status_id`, `category_id`
- `source_collected_at`, `last_modified_at`
- `route`, `authority`, `content_hash`
- `symbols`, `companies`, `persons`, `topics`

Exact symbol enrichment is conservative: only exact tokens found in authoritative `Instrument.LVal18AFC` are accepted. Company metadata is attached only through that exact symbol match. No LLM/entity guess is used during ingestion.

## Deletion and deduplication
- `IsDeleted` becomes a tombstone: existing Qdrant chunks for the document are deleted.
- ignored/unknown content types also remove previously indexed versions.
- SHA-256 `content_hash` is stored in payload metadata.
- batch hash lookup prevents embedding/upsert when content is unchanged.

## Scale / synchronization
The old Sprint-9 worker stopped after the first `BatchSize` rows. Sprint 24 uses streaming batches and therefore processes all rows (e.g. all ~61k Content rows) without loading the whole table into memory.

Auto-discovered sources use a high-watermark (`@Since`) with a configurable overlap. Watermarks are committed only after a complete successful source pass. A process restart may cause a safe re-scan; `content_hash` keeps Qdrant writes idempotent.

Defaults:
- `BatchSize=250` (clamped to 1..500)
- `MaxDocumentsPerSourceRun=100000`
- `WatermarkOverlapMinutes=5`

## Trust boundary
Structured market/financial facts remain SQL/Redis Tool facts. RAG text is descriptive evidence. LLM cannot execute SQL, fetch arbitrary URLs, or promote RAG-extracted numbers over canonical structured values.

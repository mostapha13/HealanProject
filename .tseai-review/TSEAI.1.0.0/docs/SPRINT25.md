# Sprint 25 — Advanced Hybrid Retrieval

Status: COMPLETE
Version: `1.0.0-rc.14`
Baseline: Sprint 24 / `1.0.0-rc.13`

## Delivered
- Deterministic hybrid reranking: dense vector + BM25-like lexical score + phrase/entity boost + freshness + authority.
- Expanded dense candidate pool before reranking; no LLM participates in retrieval ranking.
- Explicit metadata filters for symbol, company, topic, route, content type and language.
- Published-at date range filtering with Qdrant datetime payload index.
- Deterministic inference of News ContentType for Persian خبر/اخبار/اطلاعیه queries.
- Deterministic latest/freshness behavior for آخرین/جدیدترین/تازه/امروز/اخیر queries.
- Per-document chunk diversity cap to reduce duplicate evidence from a single long document.
- Score explainability fields: vector_score, bm25_score/keyword_score, phrase_score, entity_score, freshness_score.
- Fixed AI/.NET retrieval contract mismatch: `/knowledge/retrieve` returns `items` and HttpKnowledgeRetriever now consumes it.
- Chat now passes canonical temporal date range and resolved symbol into Knowledge retrieval.
- Backward compatibility preserved with `keyword_score` alias.

## Safety / authority
- Retrieval ranks descriptive evidence only; structured numeric market facts remain authoritative through SQL/Redis tools.
- Unknown/fuzzy entity guessing is not added here; symbol filter comes from the authoritative Entity Resolver.
- Date filters are metadata constraints and never fabricate missing historical content.

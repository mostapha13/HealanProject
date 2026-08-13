# TSEAI 1.0 Final Candidate Release Notes

Implementation roadmap Sprint 0–40 is complete.

Major delivered capabilities include canonical market data, Persian temporal and entity resolution, quality/freshness gates, secure structured tools, deterministic analytics, natural-language structured query, TSETMC-compatible conversational filters, saved filters/alerts, knowledge ingestion, hybrid retrieval, centralized capability routing, bounded multi-tool DAG planning, conversational/temporal context, evidence/citations, hallucination guard, Persian financial answer composition, rich RTL chat UI, semantic admin registry, 320-case Golden Dataset, evaluation tooling, caching/performance telemetry, security hardening, production E2E runner, and fail-closed GA readiness.

## GA blockers in the packaging environment
- .NET SDK unavailable: restore/build/test not executed.
- Docker unavailable: production compose/live services not executed.
- Live 320-case Golden evaluation not executed because API stack is not running.
- Frontend lockfile cannot be generated from the offline npm cache because `@microsoft/signalr` metadata is not cached; reproducible `npm ci` remains open.
- Live load/security DAST/backup-restore drill remain production-host gates.

No `v1.0.0` tag should be created until `python scripts/ga-readiness.py --require-live` returns `GA_READY`.

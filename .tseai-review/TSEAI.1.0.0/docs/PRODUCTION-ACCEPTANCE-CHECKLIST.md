# Production E2E Acceptance Checklist

All items are hard gates before GA:

- [ ] Static/build evidence is fresh, version-matched and PASS.
- [ ] Docker production config/build/up and all required runtime health checks pass.
- [ ] SQL AI and Market credentials are verified read-only against authoritative schemas.
- [ ] Redis context/cache, RabbitMQ alert delivery and Qdrant retrieval are live.
- [ ] All 320 Golden cases pass the configured quality thresholds and dataset hash check.
- [ ] All strict multi-turn Conversation Golden flows pass with the matching suite hash, preserved context and exact answer-shape checks.
- [ ] Load test executes at least 200 requests for 20 distinct concurrent users with zero errors and p95 <= 5000 ms.
- [ ] Security DAST verifies headers, anonymous admin denial, invalid JWT denial, body limits and adversarial prompts.
- [ ] Backup/restore drill passes for `TSEAI_App` and `TSEAI_Identity`, including `RESTORE VERIFYONLY` and `DBCC CHECKDB`.
- [ ] Historical/future market queries remain fail-closed while `MarketDailyHistory` is absent.
- [ ] CycloneDX SBOM is version-matched; npm, NuGet and Python audits have no release-blocking findings.
- [ ] `artifacts/production-acceptance.json` is PASS and `artifacts/ga-readiness.json` is `GA_READY`.

Required load-test environment variable:

`TSEAI_PERFORMANCE_BEARER_TOKENS=<20 comma-separated dedicated test-user tokens>`

Optional authenticated Golden token:

`TSEAI_EVALUATION_BEARER_TOKEN=<dedicated-evaluation-token>`

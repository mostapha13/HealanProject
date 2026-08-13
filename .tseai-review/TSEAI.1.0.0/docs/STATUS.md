# TSEAI implementation status

Current baseline: **Enterprise Release Candidate**  
Version: **1.0.0-rc.31**  
GA status: **BLOCKED until fresh production evidence passes**

## Completed product increments

- Sprints 0-40: product foundation, identity, market runtime, filters, alerts, RAG, chat, deterministic Persian temporal/entity/data-quality engines, controlled tool gateway, analytics, conversation state, evidence/citations, answer validation, admin operations and Golden evaluation framework.
- Sprint 41: deterministic clean build, defect repair, locked restores and automatic smoke discovery.
- Sprint 42: fail-closed 320-case evaluation and version/dataset evidence integrity.
- Sprint 43: reproducible frontend/Python supply chain, vulnerability gates and CycloneDX SBOM.
- Sprint 44 source controls: refresh-token replay protection, HttpOnly refresh flow, dependency-aware readiness, bounded error handling, operational counters, hardened containers and security/load/restore gate tooling.

## Verified for rc.31

- 65 Python tests pass.
- Full locked .NET solution build: 0 warnings, 0 errors.
- 14/14 discovered .NET smoke projects pass.
- Frontend `npm ci`, production build and audit pass with 0 vulnerabilities.
- Python audit passes with 0 known vulnerabilities.
- All eight application Docker images build successfully.
- Static security audit, Compose validation and CycloneDX SBOM generation pass.
- Static release evidence is version-matched and PASS.
- Local SQL `AI` schema compatibility and representative adapter queries pass read-only.
- Both checksum-pinned local models load on CUDA; Persian chat and 1,024-dimensional embeddings pass.

## Sprint 45 — production certification

The authoritative local SQL schema/data has been assessed read-only, and the dedicated login plus fixed container endpoint have been verified. Certification remains pending because the temporary weak SQL password must be rotated and no production acceptance window has run. The automated gate requires full SQL/Redis/RabbitMQ/Qdrant/model readiness, 320-case live Golden evaluation, authenticated 200-request/concurrency-20 load test, DAST, isolated backup/restore drill and fresh matching evidence before it can emit `GA_READY`.

Promotion command: `python scripts/ga-readiness.py --require-live`

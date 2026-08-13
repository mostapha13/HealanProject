# TSEAI Status

Current baseline: **Enterprise Release Candidate**  
Version: **1.0.0-rc.31**

## Verified in this package

- All structural validators pass.
- Python suite passes with warnings treated as errors.
- The full .NET solution restores in locked mode and builds with zero warnings/errors.
- All discovered .NET console smoke tests pass.
- Frontend reproducible build and npm high-severity audit pass.
- NuGet/npm/Python dependency graphs are locked; Python installation requires hashes.
- Python dependency audit reports zero known vulnerabilities.
- Static security audit and CycloneDX SBOM generation pass.
- Production Compose configuration validates and application images use non-root/read-only controls where applicable.
- Read-only compatibility against the local `AI` database has been verified, including the live source schema and populated fallback sources.
- Local CUDA inference and embedding services are defined in Compose with checksum-verified, read-only model mounts.

## Live gates still required

- Production data-quality checks through the verified container-to-host SQL connection.
- Running Redis, RabbitMQ, Qdrant, notification and worker integration.
- 320-case live Golden evaluation.
- Authenticated 200-request/concurrency-20 load gate with at least 20 distinct user tokens.
- DAST/authz/adversarial corpus.
- Destructive restore drill into isolated databases plus DBCC integrity checks.

Promotion rule: `python scripts/ga-readiness.py --require-live` must return `GA_READY` before tagging `v1.0.0`.

# Healan Project Context

This document records stable product and architecture decisions for future
development work. Do not put passwords, API keys, connection strings, OTPs, or
other secrets in this file.

## Product

- Healan is a product-oriented clinic and medical-practice management system.
- It must be deployable for different doctors, clinics, hospitals, and medical
  centers with each center's own data and configuration.
- The current public deployment is for Dr. Masoumeh Shahrooei:
  - Public website: `https://www.drshahrooei.ir`
  - Clinic application: `https://clinic.drshahrooei.ir`
- The current deployment is an instance of the product, not a hard-coded
  Dr. Shahrooei-only product.

## Tenancy and data isolation

- The intended deployment model is database-per-center.
- Every clinic or medical center has its own operational database.
- Product features, branding, content, credentials, and infrastructure settings
  must therefore be configurable per deployment.
- Changes must be reviewed for accidental dependencies on the current doctor's
  identity, domain, phone number, address, branding, seed data, or database.

## Source control

- `master` is the canonical and production-ready branch.
- Development has historically been performed on `ai`.
- Completed and verified work from `ai` is merged into `master`.
- Before changing code, confirm whether the work should start from `master` or
  compare/pick pending changes from `ai`.

## Technology and architecture

- Backend: ASP.NET Core 9, organized as multiple services and layered projects.
- Main backend services:
  - `Healan`: core medical and clinic domain.
  - `IdentityProvider`: authentication, authorization, users, roles, and access
    policies.
  - `FileManager`: storage, retrieval, signatures, and file access.
  - `CaptchaProvider`: CAPTCHA generation and validation.
  - `SMSProvider`: SMS delivery, queue consumption, runtime settings, and
    outbox/logging.
  - `WorkFlow`: processes, forms, worklists, approvals, rejections, and archives.
  - `Notification`: present in the solution but not yet integrated into Healan.
  - `Share`: shared security, cache, messaging, and infrastructure components.
- Datastores and infrastructure:
  - SQL Server for relational/operational data.
  - Redis for caching and transient state.
  - ChromaDB for RAG vector storage.
  - RabbitMQ for asynchronous queues such as SMS and RAG logs.
- AI service: Python/FastAPI with Persian RAG, SQL-backed knowledge ingestion,
  embeddings, ChromaDB retrieval, optional summarization, quotas, and logs.
- Frontend code currently includes an Nx/React workspace and Expo-based PWAs.
- Public user-facing pages should use Next.js where appropriate for SEO and
  server-rendered public content. Confirm the exact Next.js source location
  before public-site changes because the currently inspected Nx projects are
  React/Webpack SPAs.

## Product boundaries

- Old stock-market projects and domain artifacts (for example `cash-market`,
  `regions-hall`, MarketMaker, Instrument, and similar TSE concepts) are legacy.
- They should be removed only after proving that no Healan runtime, migration,
  shared library, seed, build target, or deployment configuration depends on
  them.
- Notification channels and implementation will be selected when a concrete
  product requirement exists.

## Current engineering priorities

- Prefer code-first investigation and evidence-backed changes.
- Assess whether the product is genuinely complete rather than assuming feature
  completeness from the current production deployment.
- Important review dimensions:
  - database-per-center configurability and isolation;
  - removal of doctor/domain-specific hard-coding;
  - authentication and authorization correctness;
  - protection of medical and personal data;
  - booking concurrency and idempotency;
  - migration, backup, restore, and per-center deployment automation;
  - observability, audit trails, and failure recovery;
  - automated test coverage;
  - safe removal of legacy TSE code;
  - public-site SEO and separation from the authenticated clinic application.

## Production rules

- Production project path is `/opt/healan`.
- Follow `.cursor/rules/healan-server-deploy.mdc` for deployment.
- Use targeted service rebuilds; do not take down or rebuild the entire stack for
  a scoped change.
- Production secrets come from `/opt/healan/.env`; never hard-code or commit them.

## Working agreement

- The repository path on the development machine is:
  `C:\SourceCode\Mst\HealanProject`
- For NegareshAI work, read and update `Docs/NEGARESHAI-STATUS.md` as the
  persistent handoff and resume point.
- Never persist test or production passwords in repository documentation.
- Inspect relevant code and dependencies before deleting legacy components.
- Validate changes in proportion to their impact before merging into `master`.

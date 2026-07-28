# NegareshAI Development Status

Last updated: 2026-07-28
Active branch: `codex/negareshai-foundation`
Last committed baseline: `4a432c8` (`Configure FileManager endpoint for NegareshAI`)

This is the persistent handoff document for NegareshAI. Update it at the end of
every development session. Do not store passwords, tokens, connection strings,
or other secrets here.

## Resume protocol

When work resumes:

1. Read this file first.
2. Read `Docs/NEGARESHAI-PRODUCT-SPEC.md` as the authoritative product logic.
3. Read `Docs/NEGARESHAI-ROADMAP.md` for the audited implementation status and
   fixed priority order.
4. Run `git status --short` and inspect only changes newer than this handoff.
5. Start from **Next action** below.
6. Update this file with completed work, validation results, blockers, and the
   new next action before ending the session.

Do not re-audit the whole repository unless this file is missing, inconsistent
with Git, or the requested work changes scope.

## Verified continuation checkpoint

Checkpoint `docker-through-filemanager` is complete and must not be repeated:

- NegareshAI Web, API, AI/Chroma, and SQL containers are built, running, and
  healthy.
- Shared SQL Server, Identity gRPC, Captcha, IdentityServer, FileManager gRPC,
  FileManager WebUI, project Redis, and project RabbitMQ are running in Docker.
- Identity token acquisition and authenticated PDF upload through NegareshAI
  into FileManager were validated successfully.

Resume after this checkpoint. The first unfinished Docker service in root
Compose is `identity-usermanager`; then continue in Compose order/dependency
groups. Recheck completed services only when a new change affects them or a
health/runtime failure is observed.

## Goal and boundary

Build NegareshAI as an independent Persian document-intelligence product for
contracts and compliance. Its API, AI/RAG service, frontend, SQL database, and
vector store are isolated from Healan. Shared platform services such as
IdentityProvider and FileManager are consumed only through APIs.

The detailed and authoritative product behavior, including natural-language
contract renewal/generation, private organizational RAG, company-letterhead
DOCX/PDF output, and multi-mode document/prospectus matching, is defined in
`Docs/NEGARESHAI-PRODUCT-SPEC.md`.

The code-audited completion state and execution priorities P0 through P6 are
defined in `Docs/NEGARESHAI-ROADMAP.md`. Do not count prototype AI endpoints as
completed product capabilities.

The latest executable acceptance matrix is
`Docs/NEGARESHAI-ACCEPTANCE-2026-07-28.md`.

## Completed foundation

- Independent NegareshAI API, AI service, frontend, Compose stack, and SQL
  migration were added.
- JWT authentication and document registration endpoints were added.
- FileManager client and authenticated PDF/DOCX upload flow were added.
- Persian document extraction and structural chunking were added.
- Local embedding and persistent Chroma vector storage were added.
- Word contract template generation and hardened placeholder replacement were
  added.
- Contract comparison and checklist-based compliance analysis were added.
- Compliance evidence and focus analysis were added.
- Modern Persian RTL dashboard was added and connected to the document API.
- Frontend, API, SQL Server, and AI service were containerized.
- Upload progress UI and the configurable FileManager endpoint were added.
- The complete NegareshAI stack now runs through Docker Compose:
  - SQL Server with a persistent versioned volume and health check.
  - ASP.NET Core API with automatic EF migration, CORS, restart policy, and
    health check.
  - FastAPI/Chroma service with persistent vector storage and health check.
  - Next.js standalone frontend with build-time public API configuration and
    health check.

The detailed commit sequence is available with:

```powershell
git log --oneline --reverse -- Backend/NegareshAI AI/NegareshAI Frontend/negareshai docker-compose.negareshai.yml
```

## Current uncommitted work

- Fixed Swagger generation for `POST /api/documents/upload`.
  - Added `UploadDocumentRequest` as the multipart form model.
  - Changed `DocumentsController.Upload` to accept that model.
- Added `Backend/NegareshAI/tests/NegareshAI.Api.Tests`.
  - The regression test generates the Swagger document in an ASP.NET host.
  - It verifies the upload operation uses `multipart/form-data`, exposes all
    expected form fields, and describes the file as binary.
  - Controller tests verify empty files and unsupported MIME types are rejected
    before FileManager is called.
- Refactored the Documents use cases to the required Basic-project architecture:
  - MediatR commands for upload and registration.
  - MediatR query for document read.
  - AutoMapper profile for command/entity/response mapping.
  - Thin controller using `ISender` with no direct DbContext access.
  - Architecture test verifies handler registration and valid mapping config.
- Completed P0 tenant security and contract-domain sprint:
  - Removed client-controlled OrganizationId from upload/register contracts.
  - Added claim-based server tenant context with Development-only configured
    fallback and Production fail-closed behavior.
  - Added tenant-filtered read and soft-delete handlers.
  - Added confidentiality, processing status, organization membership, and
    audit logging for create/view/delete.
  - Added Contract, ContractParty, ContractClause, ContractValue,
    ContractDate, ContractObligation, and DocumentAttachment entities.
  - Added and applied `P0TenantSecurityAndContractDomain` migration.
- Next.js generated/normalized `Frontend/negareshai/tsconfig.json` and
  `Frontend/negareshai/next-env.d.ts`.
- Other pre-existing generated or experimental untracked paths remain and must
  not be committed blindly:
  - `Backend/NegareshAI/publish/`
  - `Backend/Share/tests/`
  - root `package-lock.json`
- `.dockerignore` also has an uncommitted modification.
- Docker hardening and runtime changes are also uncommitted:
  - `docker-compose.negareshai.yml`
  - all three NegareshAI Dockerfiles
  - API migration/CORS startup changes
  - frontend API URL correction
  - Next.js upgrade from 15.1.6 to 15.5.21
  - NegareshAI variables in `.env.example`
- Shared-service Docker reliability changes are uncommitted:
  - `docker/dotnet-service.Dockerfile` now caches NuGet packages, retries
    restore, disables parallel restore, and publishes with `--no-restore`.
  - `docker/dotnet-prepublished.Dockerfile` and
    `docker-compose.local-prepublished.yml` provide an offline/local-publish
    fallback for unstable Docker DNS/NuGet access.
  - The local override starts project-owned Redis and RabbitMQ containers
    without host ports, avoiding collisions with unrelated local containers.
  - `docker/local-publish/` is ignored and must remain an artifact, not source.

Always confirm the exact intended commit scope with `git diff` and
`git status --short`.

## Latest validation

Performed on 2026-07-28:

- `npm.cmd run build` in `Frontend/negareshai`: passed.
- `dotnet build Backend\NegareshAI\src\NegareshAI.Api\NegareshAI.Api.csproj --no-restore`:
  passed with zero warnings and zero errors after the upload fix.
- Runtime `GET /health`: returned `healthy`.
- Runtime `GET /swagger/v1/swagger.json`: returned HTTP 200.
- Swagger contains `POST /api/documents/upload`.
- `git diff --check`: passed.
- `Backend/Share/tests/Share.Infrastructure.Tests` builds, but contains no
  discoverable tests; `dotnet test` therefore reports that no tests are
  available.
- `dotnet test Backend\NegareshAI\tests\NegareshAI.Api.Tests\NegareshAI.Api.Tests.csproj --no-restore`:
  passed (8/8), including MediatR/AutoMapper, cross-tenant, soft-delete, and
  Production fail-closed validation.
- API build after adding the regression test: passed with zero warnings and
  zero errors.
- Frontend production build after adding the regression test: passed.
- `docker-compose -f docker-compose.negareshai.yml config --quiet`: passed.
- All NegareshAI images built successfully.
- All four containers are running and healthy:
  - `negareshai-db` on host port 14330
  - `negareshai-api` on host port 6129
  - `negareshai-ai` on host port 8000
  - `negareshai-web` on host port 3000
- Docker smoke tests:
  - Web, API health, API Swagger, and AI health returned HTTP 200.
  - API CORS preflight returned HTTP 204 and allowed
    `http://localhost:3000`.
  - An unauthenticated protected document request returned HTTP 401.
  - EF migration created 7 SQL tables.
  - Chroma indexing/search succeeded and the indexed item remained available
    after restarting the AI container.
- The running Web container uses Next.js 15.5.21.
- Root `docker-compose.yml` configuration validation also passed.
- Shared IdentityProvider and FileManager dependencies were locally published,
  built into Docker images, and started with the root Compose stack.
- Identity discovery and FileManager Swagger returned HTTP 200.
- Identity password-grant authentication using a seeded local user succeeded.
- Authenticated PDF upload through NegareshAI to FileManager succeeded with
  HTTP 201 and returned both a document ID and a FileManager file ID.
- The final NegareshAI regression test run passed (3/3) and
  `git diff --check` passed.
- Full current-stage acceptance testing is recorded in
  `Docs/NEGARESHAI-ACCEPTANCE-2026-07-28.md`.
- PDF and DOCX authenticated uploads both pass end to end.
- GET document now returns the persisted version FileId correctly.
- SQL migration on the reproducible `negareshai-sql-v3` volume created seven
  base tables; final acceptance uploads created matching Document and
  DocumentVersion rows.
- AI prototype tests passed for PDF/DOCX extraction, chunking, Chroma
  index/search and restart persistence, placeholder DOCX generation,
  paragraph comparison, and literal checklist matching.
- P0 runtime acceptance passed: a malicious OrganizationId form value was
  ignored, the server organization was persisted, confidentiality was retained,
  create/view/delete audits were written, and soft delete hid the document.
- Production requires IdentityProvider to issue a trusted organization claim;
  the Development fallback is not accepted outside Development.

## Environment limitations and known issues

- This machine provides standalone `docker-compose` rather than the
  `docker compose` subcommand. The NegareshAI stack was built and tested with
  `docker-compose`.
- Local sandboxed API execution logs a Data Protection key-ring access warning
  for the user profile. The API still starts and the health/Swagger smoke tests
  pass. This is an execution-environment permission issue, not yet shown to be
  an application defect.
- Shared backend projects emit existing nullability, obsolete API, and NuGet
  vulnerability warnings. They are outside the latest scoped upload fix.
- npm audit still reports three high-severity transitive issues through
  Next.js (`postcss` and optional `sharp`) even after upgrading to the official
  Next.js 15 Maintenance LTS security release 15.5.21. Do not apply npm's
  suggested downgrade to Next.js 9.3.3; review safe overrides or a tested
  upgrade path instead.
- Docker image restore for the shared .NET services encountered intermittent
  DNS/TLS failures against NuGet and Debian repositories. The checked-in
  local-prepublished override is the current reproducible development
  fallback; a clean online build still needs validation when registry access
  is stable.
- Only the NegareshAI stack plus the shared services required for its
  authenticated upload path have been started and validated in this session.
  The remaining root Compose application services still need a systematic
  Docker build/start/health audit to satisfy the whole-repository
  containerization requirement.
- Shared FileManager/Share builds currently report known NuGet vulnerability
  warnings, including MessagePack and DotNetZip. These require remediation or
  explicit documented risk acceptance.
- The local frontend build completed using stale local `node_modules` reporting
  Next.js 15.1.6, while the running Docker image reports 15.5.21. A clean
  dependency install/build must be made reproducible.

## Next action

1. Start P1 in `Docs/NEGARESHAI-ROADMAP.md`: tenant-scoped document/contract
   list, search, create, edit, new-version and archive APIs plus management UI.
2. Continue Docker work only for services required by NegareshAI. The verified
   `docker-through-filemanager` checkpoint must not be repeated.
3. Add a repeatable scripted Docker smoke test for Identity token acquisition,
   FileManager upload, and NegareshAI document registration without logging
   credentials or bearer tokens.
4. Review uncommitted/generated files and separate intentional source changes
   from artifacts.
5. Commit the verified upload/Swagger, Docker, product-specification, and
   regression-test changes with
   only the
   intended files after commit authorization is given.
6. Add an integration test for the successful FileManager handoff and SQL
   document registration.
7. Resolve or explicitly risk-accept the remaining transitive npm audit
   findings after compatibility testing.

## Session log

### 2026-07-28

- Resumed from commit `4a432c8`.
- Built the frontend and API.
- Discovered that the Share test project contains no tests.
- Smoke testing found Swagger HTTP 500 caused by separate `[FromForm]`
  parameters including `IFormFile`.
- Replaced those parameters with a multipart request model.
- Verified health, Swagger HTTP 200, and upload operation discovery.
- Added and passed a Swagger/multipart regression test.
- Added controller validation tests for empty and unsupported files; all three
  NegareshAI API tests pass.
- Re-ran the API build, frontend production build, and `git diff --check`;
  all passed.
- Added automatic SQL migration with startup retry, configurable CORS, health
  checks, restart policies, versioned SQL persistence, and Docker-safe shared
  service URLs.
- Corrected the browser API port from 6128 to 6129.
- Built and started all four NegareshAI containers; all are healthy.
- Verified SQL migration, CORS, authentication enforcement, Swagger, Web/API/AI
  health, and Chroma persistence across an AI container restart.
- Upgraded Next.js from vulnerable 15.1.6 to official Maintenance LTS security
  release 15.5.21 and verified the version inside the running container.
- Hardened the shared .NET Docker build with NuGet caching, serialized restore,
  retries, and publish without a second restore.
- Added a local-prepublished Docker fallback after repeated Docker-side NuGet
  DNS/TLS failures.
- Started SQL Server, Identity gRPC, Captcha, IdentityServer, FileManager gRPC,
  FileManager WebUI, and dedicated project Redis/RabbitMQ containers.
- Fixed local runtime collisions with unrelated Redis/RabbitMQ containers by
  giving the project-owned dependencies unique container names and internal
  ports in the override.
- Verified Identity and FileManager HTTP endpoints.
- Completed a real authenticated PDF upload from NegareshAI through
  FileManager; it returned HTTP 201 with persisted document/file identifiers.
- Re-ran the NegareshAI API regression tests (3/3) and `git diff --check`.
- Recorded the authoritative product logic in
  `Docs/NEGARESHAI-PRODUCT-SPEC.md`, including:
  - private/on-premise contract and document processing;
  - natural-language contract creation and renewal using approved RAG sources;
  - percentage/date/amount changes, new legal clauses, and company-letterhead
    DOCX/PDF generation with human approval;
  - document/prospectus matching by group, selectable rule parameters, an
    explicit reference document, or a combination of those modes;
  - evidence-backed, page-level, auditable conformity results.
- Audited the actual API, AI service, database model, and frontend against the
  product specification and recorded the honest completion state and P0-P6
  priority order in `Docs/NEGARESHAI-ROADMAP.md`.
- Executed a full current-stage acceptance pass and recorded the matrix in
  `Docs/NEGARESHAI-ACCEPTANCE-2026-07-28.md`.
- Found and fixed FileManager DOCX upload failure caused by MIME detection
  closing the shared stream.
- Found and fixed empty FileId in document GET responses by eagerly loading
  document versions.
- Revalidated authenticated PDF and DOCX upload, SQL persistence, API readback,
  AI prototype endpoints, and Chroma persistence.
- Demonstrated that client-controlled OrganizationId and absent tenant
  isolation block confidential production use; P0 remains the next action.
- Made AutoMapper and MediatR mandatory architectural dependencies, matching
  the Identity/FileManager Basic-project pattern.
- Moved document upload/register/get orchestration into MediatR handlers and
  added AutoMapper profiles.
- Rebuilt the API Docker image and revalidated health, Swagger, authenticated
  PDF/DOCX upload, GET, and persisted FileId after the refactor.
- Completed the P0 sprint using MediatR/AutoMapper: server tenant context,
  cross-tenant filtering, Production fail-closed, domain entities,
  confidentiality, processing state, membership, audit and soft delete.
- Added the P0 EF migration and applied it automatically in Docker.
- Rebuilt API/Web images with Next.js 15.5.21 and revalidated PDF/DOCX.
- P0 acceptance produced HTTP 201 upload, server-owned organization,
  confidentiality level 3, HTTP 204 soft delete, HTTP 404 after delete,
  three audit rows, one membership row, and 16 SQL base tables.

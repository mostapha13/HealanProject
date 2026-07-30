# NegareshAI Development Status

Last updated: 2026-07-30
Active branch: `codex/negareshai-foundation`
Last committed baseline: `2e8f64b` (`Complete private RAG and document comparison`)

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

## Authoritative current checkpoint — 2026-07-30

### P4 implementation checkpoint

- P4 contract generation is implemented in the working tree.
- Added tenant-scoped versioned DOCX templates, deterministic Persian
  ChangeSets, Jalali date/amount/percentage validation and calculations,
  clarification questions, source/template/model snapshots, diff preview,
  private DOCX generation, human review and immutable approved draft versions.
- Backend tests pass 21/21.
- Local and Docker frontend production builds pass.
- API and Web Docker images were built successfully.
- Live recreation is blocked only by the absent local
  `NEGARESHAI_SQL_PASSWORD`; no credential was extracted or persisted.
- Acceptance details: `Docs/NEGARESHAI-ACCEPTANCE-P4-2026-07-30.md`.

This section is the current source of truth. Older sections below are retained
as historical session detail and may describe work that was uncommitted at that
earlier checkpoint.

### Git state

- Active branch: `codex/negareshai-foundation`
- Latest committed and pushed checkpoint:
  `2e8f64b Complete private RAG and document comparison`
- That commit contains the completed P2 private Persian RAG pipeline and the
  completed P3 knowledge-management/document-comparison implementation.
- The Persian-calendar work described below is implemented and tested locally,
  but is **not committed or pushed yet**.
- Pre-existing untracked artifacts that are outside the current change and must
  not be staged blindly:
  - `Backend/NegareshAI/publish/`
  - `Backend/Share/tests/`
  - root `package-lock.json`

### Stage status

| Stage | Status | Summary |
|---|---|---|
| P0 | Complete | Tenant security, fail-closed organization context, auditing, contract domain and migrations |
| P1 | Complete | Document/contract CRUD, immutable versions, archive/restore and secure download |
| P2 | Complete | Private Persian RAG, OCR, BGE-M3, tenant/ACL filtering, citations and offline benchmark |
| P3 | Complete | Document groups, versioned RuleSets, four comparison modes, findings/review and DOCX/PDF reports |
| Persian calendar cross-cutting change | Implemented and locally tested; uncommitted | Jalali display and input throughout the current NegareshAI UI and reports |
| P4 | Not started | Intelligent contract creation and renewal |
| P5 | Not started | Workflow, risk and contract operations |
| P6 | Not started | Security hardening, E2E, operations and release |

### Persian-calendar implementation

Product rule:

- Every human-facing date in NegareshAI must be displayed in the Jalali
  calendar with Persian digits.
- Date selection must use the Persian-calendar logic already established in
  the Healan project.
- Database persistence and API transport remain Gregorian ISO/UTC. Conversion
  happens at presentation/input boundaries so ordering, filtering, arithmetic
  and interoperability remain correct.
- Server-generated report times are converted from UTC to the Iran time zone
  before Jalali formatting.

Implemented files:

- `Frontend/negareshai/lib/jalali.ts`
  - dependency-free Gregorian/Jalali conversion adapted from Healan;
  - Persian/Arabic digit normalization;
  - short, date-time and long Jalali formatting;
  - leap-year, month-length, weekday and month-navigation helpers;
  - Gregorian `YYYY-MM-DD` to/from Jalali conversion.
- `Frontend/negareshai/app/PersianCalendar.tsx`
  - reusable accessible Persian date picker;
  - Jalali month navigation, Saturday-first grid, today/selected states,
    outside-click close, today and clear actions;
  - emits Gregorian `YYYY-MM-DD` for the existing API contract.
- `Frontend/negareshai/app/page.tsx`
  - all current visible document, version, runtime-setting, contract,
    comparison-run, activity and deadline dates use Jalali formatting;
  - dashboard full date is Jalali;
  - deadline day/month tile is calculated from the Jalali date;
  - contract start/end native Gregorian inputs were replaced with the shared
    Persian calendar.
- `Frontend/negareshai/app/globals.css`
  - Persian-calendar trigger, popover, grid, selected/today and action styles.
- `Backend/NegareshAI/src/NegareshAI.Api/Application/Common/Dates/PersianDate.cs`
  - server-side formatter/parser based on
    `System.Globalization.PersianCalendar`, following the Healan approach;
  - Persian and Arabic digit support;
  - deterministic UTC-to-Iran conversion for reports.
- `Backend/NegareshAI/src/NegareshAI.Api/Services/IComparisonReportGenerator.cs`
  - sends a Jalali `CreatedAtLabel` to the report service instead of exposing a
    raw Gregorian timestamp as report text.
- `AI/NegareshAI/main.py`
  - DOCX and PDF comparison reports render the supplied Jalali execution date.
- `Backend/NegareshAI/tests/NegareshAI.Api.Tests/PersianDateTests.cs`
  - Nowruz conversion, Persian/Arabic digit parsing, invalid Esfand date and
    UTC-to-Iran midnight-boundary coverage.

Current local validation:

- `npm.cmd run build` in `Frontend/negareshai`: passed with Next.js 15.5.21.
- `dotnet test Backend/NegareshAI/tests/NegareshAI.Api.Tests/NegareshAI.Api.Tests.csproj --no-restore`:
  passed, **19/19**.
- TypeScript validation and static page generation: passed.
- `git diff --check`: passed.
- Python AST validation could not be run on the host because Python/`py` is not
  installed in the current shell. The edited Python change is limited to
  reading the new `createdAtLabel` payload field and adding it to the PDF
  report story; validate it inside the AI Docker image on the next Docker run.

### Docker continuation state

Last verified state before this checkpoint:

- `negareshai-web`: running and available at `http://localhost:3000`.
- `negareshai-ai`: running and healthy at `http://localhost:8000/health`.
- `negareshai-db`: running and healthy.
- `negareshai-api`: deliberately stopped because the real local
  `NEGARESHAI_SQL_PASSWORD` was not available. Trying the example value failed
  SQL authentication; no secret was persisted.
- Do not recreate/start the API against the existing SQL volume until the
  operator supplies the correct password through the local `.env`.
- A fresh Docker status check was attempted while writing this handoff, but
  this sandbox could not access the Docker named pipe. Therefore the list above
  is the last verified runtime state, not a claim about the live engine at the
  exact handoff time.

### Exact next action

1. Review the Persian-calendar diff and commit only the listed source/test/doc
   files, excluding the three pre-existing untracked artifacts.
2. Push `codex/negareshai-foundation`.
3. With the operator-provided local SQL password, rebuild/recreate Web, AI and
   API, then run:
   - Web smoke test;
   - AI health and Python/report test;
   - API health/authenticated flow;
   - manual contract create/edit using Jalali start/end dates;
   - DOCX and PDF report download confirming Jalali execution date.
4. Start P4 with organization-owned templates and letterheads, then structured
   Persian ChangeSets for contract creation/renewal.

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

- Database-driven configuration is now a mandatory product rule:
  - operational UI data has no hard-coded fallback records;
  - AI model, group-feature, comparison-rule and module settings are loaded at
    runtime through tenant-scoped API/database records;
  - missing configuration produces an honest empty/unconfigured state.
- Added the tenant-scoped, versioned and audited `RuntimeSetting` entity, API,
  MediatR handlers and `DynamicRuntimeConfiguration` migration.
- Added a tenant-scoped dashboard query/API for organization identity, current
  user, document/contract counts, recent documents, audit activities and
  upcoming contract deadlines.
- Completed working UI navigation for overview, documents, contracts,
  comparison, AI assistant, reports and organization settings. Modules whose
  business sprint is not implemented show a database-driven empty state rather
  than simulated operational data.
- A professional Persian RTL product dashboard has been implemented before P2:
  - dedicated NegareshAI visual system and responsive navigation;
  - document/contract KPIs, recent documents, processing states, activity and
    upcoming contract deadlines;
  - an on-premise AI assistant entry surface;
  - responsive upload modal with progress and secure-processing messaging;
  - desktop and mobile layouts with browser-based visual QA.
- The dashboard and every operational module use live tenant data; API or
  configuration failure produces an explicit empty/error state and never
  simulated operational records.
- P1 has started with the first tenant-scoped document-management slice:
  - paginated list/search with document type and processing-status filters;
  - document metadata edit;
  - immutable new-version upload through FileManager;
  - audit events for edit and version creation;
  - document list/search UI with version counts and upload refresh.
- The P1 handlers use MediatR, responses use AutoMapper, and controllers remain
  thin.
- A Docker/SQL acceptance run found and fixed an EF tracking bug that attempted
  to update a new `DocumentVersion`; the handler now explicitly adds the new
  version to `DbSet<DocumentVersion>`.
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
- P1 first-slice validation:
  - NegareshAI API tests passed (9/9).
  - local Next.js production build passed.
  - API and Web Docker images built; all four NegareshAI containers are healthy.
  - authenticated Docker acceptance passed for upload, list/search, metadata
    edit, and second-version upload.
  - the final document list returned one matching row with `VersionCount = 2`;
    the latest FileManager file ID differed from version 1.
- UI review build:
  - local Next.js production build passed.
  - Docker Next.js 15.5.21 image built and the Web container was recreated.
  - `http://localhost:3000` returned HTTP 200.
  - browser QA passed for desktop dashboard, upload modal and the mobile
    breakpoint without horizontal overflow.
- Dynamic UI validation:
  - Backend tests passed (10/10), including versioned tenant isolation for
    runtime settings.
  - frontend production build passed.
  - Docker migration created `RuntimeSettings`.
  - authenticated dashboard returned database counts and recent documents.
  - a runtime `ui/dashboard` setting was written, versioned and read back
    through the tenant-scoped API.

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

1. Start P4 with organization-owned templates and letterheads.
2. Add Persian natural-language ChangeSets for contract creation and renewal.
3. Add deterministic date, amount and percentage calculations.
4. Add source-backed clause generation, diff preview and human approval.
5. Resolve or explicitly risk-accept the remaining transitive npm audit
   findings after compatibility testing.

## Session log

### 2026-07-28

- Product-owner checkpoint on 2026-07-29:
  - all production documents are Persian and contain important amounts, dates,
    percentages and identifiers;
  - selected `BAAI/bge-m3` for multilingual long-document retrieval;
  - added hybrid reranking with Persian/Latin digit normalization and an exact
    numeric-match boost;
  - added a numeric test distinguishing `۱۵٬۰۰۰٬۰۰۰٬۰۰۰` from a nearby amount;
  - model selection is read from tenant runtime setting
    `ai/embedding.model`, and processing fails closed when it is absent;
  - added the idempotent development seed for BGE-M3 runtime configuration;
  - added lazy `sentence-transformers` semantic embeddings and per-model Chroma
    collections so model dimensions cannot collide.
- The first semantic image build resolved a new GPU-enabled Torch/CUDA package
  set and began a multi-gigabyte download. It was deliberately stopped.
  `requirements.txt` is now pinned to `torch==2.5.1+cpu` using the official CPU
  wheel index. The next session must rebuild from this corrected source.
- Backend regression tests after the model-setting integration pass 12/12.
- The corrected CPU image and the new numeric retrieval test have not yet been
  run; this is the exact continuation point.
- Started P2 after product-owner approval.
- Added the private `/pipeline/process` flow for PDF/DOCX extraction,
  page-aware structural chunking and Chroma indexing.
- Made organization, document and version metadata mandatory for indexing;
  search now applies a mandatory organization filter and returns page/section
  citations.
- Connected initial upload and immutable version upload to automatic processing
  through a typed API-to-AI client, with Processing/Ready/Failed state and
  success/failure audit events.
- Added a tenant-scoped manual reprocess endpoint.
- Added Docker-executed AI tests proving missing tenant context is rejected and
  organization A cannot retrieve organization B chunks; both tests pass.
- Backend tests remain green (12/12).
- P2 is not complete: the current embedding remains the explicitly documented
  hash prototype; local semantic embedding, OCR, finer ACL and quality
  benchmarks are the next work.
- Completed P1 contract CRUD and tenant-scoped queries using MediatR,
  AutoMapper, thin controllers and audit events.
- Completed document detail/version history, metadata editing, immutable new
  version upload, archive/restore and authenticated FileManager download proxy.
- Connected the Persian RTL UI to contract management and the complete document
  lifecycle, including archive and restore.
- Fixed contract-party EF state handling and normalized FileManager upload
  responses while keeping legacy stored identifiers downloadable.
- Backend tests pass 12/12 and the local Next.js production build passes.
- Full authenticated Docker/SQL acceptance passed: contract create/update/
  search/archive, party persistence, document version listing, secure download
  (149584 bytes), archive listing and restore.
- Rebuilding the final Web image requires `NEGARESHAI_SQL_PASSWORD` to be
  supplied through the operator's local `.env`; no secret is stored in history.
- Recorded the mandatory database-driven configuration rule requested by the
  product owner.
- Removed demo documents, fixed KPI values, fake activities, fake deadlines,
  fixed storage usage and fixed user/date data from the UI.
- Added runtime settings and a real database-backed dashboard API using
  MediatR, tenant filtering, versioning and audit.
- Completed interactive navigation and honest empty states for modules that
  will receive their domain implementation in later sprints.
- Paused further sprint implementation for a user-requested UI/UX approval
  checkpoint before P2.
- Replaced the prototype upload page with a professional responsive Persian RTL
  dashboard and secure upload experience.
- Corrected corrupted Persian frontend metadata and API error messages.
- Built locally and in Docker, then visually inspected desktop, modal and
  mobile states in the browser.
- Committed the completed P0 foundation as `5725fee` and pushed branch
  `codex/negareshai-foundation` to `origin`.
- Started P1 with document list/search/filter, metadata edit, immutable version
  creation, audit events, and the first management-list UI.
- Added tenant isolation coverage for P1 list and edit handlers; all 9 API tests
  pass.
- Built the frontend and rebuilt API/Web Docker images.
- During real SQL acceptance, found that a new version with a client-generated
  GUID was tracked as Modified and produced an UPDATE/concurrency exception.
  Explicitly adding it to `DocumentVersions` corrected the operation to INSERT.
- Re-ran authenticated Docker acceptance successfully: upload, edit, search,
  version 2, two retained versions, and a changed latest FileManager ID.
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
- Completed P2 with private local `BAAI/bge-m3` embeddings, scanned-PDF OCR,
  user/group ACL filtering, page citations, Persian numeric normalization and
  a deterministic retrieval quality gate.
- Built the final CPU image with Torch 2.6.0 and cached the model in the private
  Docker volume; the final acceptance ran with networking disabled.
- Passed 8/8 AI security/OCR tests, Persian Recall@1 5/5, 12/12 backend tests,
  the production frontend build with Next.js 15.5.21, Compose validation and
  `git diff --check`.
- Started P3 by adding tenant-scoped document groups, document membership,
  versioned/effective RuleSets, Rules and JSON Parameters.
- Added authenticated create/list knowledge APIs, audit events, an EF migration,
  and tenant/versioning coverage; backend tests now pass 13/13.
- Completed P3 end-to-end with group/rules/reference/combined comparison bases,
  reproducible source/rule/model/prompt snapshots, evidence-backed findings,
  expert approve/reject/correct decisions and comparison history.
- Added the complete comparison workspace UI, including knowledge management,
  execution setup, findings, page evidence, review actions and report download.
- Added Persian auditable DOCX/PDF reports. AI/report runtime tests pass 10/10;
  Persian retrieval remains Recall@1 5/5. PDF render QA passed. DOCX structural
  QA passed; visual DOCX rendering was unavailable because LibreOffice is not
  installed in the host runtime.
- Backend tests pass 15/15, frontend production and Docker builds pass, and the
  full migration chain through `P3ComparisonEngine` passed on an isolated real
  SQL Server instance.
- Final P3 images were built. The already-running local stack was intentionally
  not recreated because its SQL credential was not available through an
  authorized source; no existing service or data was changed.

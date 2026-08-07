# NegareshAI Development Status

Last updated: 2026-08-07
Active branch: `codex/negareshai-contract-ux`
Last implementation baseline: `977a741 Separate document conformity workflow`

## ChatGPT-style direct document comparison — 2026-08-07

### Product decision and implementation

- The user can explicitly choose one of three source modes: compare with one
  file, compare with an approved-reference group, or compare with both a file
  and a group. The API maps these to ReferenceDocument, DocumentGroup and
  Combined basis modes without exposing those technical enum names.
- A group behaves as an ordered collection of reference files: every active,
  Final and RAG-published approved reference receives the same evidence-backed
  pairwise analysis. When group criteria also exist, they continue to affect
  conformity scoring while detailed file-like diffs are retained as supporting
  findings. In combined mode the explicitly selected file and group references
  are de-duplicated and analyzed together.
- Group selection removes its approved references from the target selector and
  the API continues to reject invalid/self comparison. Added regression coverage
  for multi-reference group comparison; Backend tests now pass 84/84.

- Official OpenAI file-upload guidance identifies direct "compare and contrast
  two documents" as a synthesis task. Text documents are extracted and relevant
  content may be placed in context or retrieved; PDFs may also use visual
  retrieval depending on the product plan. OpenAI does not publish ChatGPT's
  private comparison prompt or exact internal algorithm, so this implementation
  reproduces the documented user experience rather than claiming model parity.
- The primary comparison journey is now intent-first: document one, document
  two, and one optional natural-language request. A document group, golden
  reference, RuleSet or technical basis selector is no longer required for this
  journey.
- Both sides support a new PDF/DOCX/image upload or reuse of an existing
  organization document. Direct user-supplied pair comparison can use extracted
  non-rejected versions immediately without first publishing either document to
  RAG. Group-approved-reference comparison remains final-only and unchanged.
- Pairwise analysis now produces an auditable overall similarity plus
  paragraph-level changed, missing and added findings, two-sided evidence,
  page attribution, suggestions and a focused finding derived from the user's
  natural-language request. The previous literal full-instruction lookup and
  single vocabulary-coverage finding are no longer used for direct pairs.
- The dashboard's comparison navigation now opens the dedicated two-document
  journey directly. Organization conformity governance, expert review, manager
  finalization, versioned reports and group-based reference workflows remain
  available after analysis.
- Added regression coverage for changed values, added clauses, two-sided
  evidence and natural-language focus. Backend tests pass 83/83; Next.js
  production build, TypeScript validation and all 37 static routes pass.

### Remaining acceptance

1. Sign in after the rebuilt local Web/API containers and run one end-to-end
   comparison using two newly uploaded files (not pre-existing documents).
2. Validate visual/scanned PDF behavior separately from text-based DOCX/PDF;
   exact scanned-table values must remain explicitly confidence-qualified.
3. Continue responsive, keyboard, accessibility and performance acceptance.

## Authenticated conformity acceptance and review UX — 2026-08-07

### Completed

- Completed an authenticated browser acceptance run for document conformity
  using `Folad-Tabriz.docx` as the target and the approved references of the
  `فولاد` group (`TataboghTest.docx` priority 1 and `Folad-Behbahan.docx`
  priority 2).
- Verified that approved reference documents are removed from the next target
  selector after the group is selected.
- The new run produced a reproducible 37.5% non-conforming result. The critical
  criteria override was active, both approved references supplied page-level
  evidence, and the per-run instruction was stored as a separately scored
  finding.
- Registered expert approval, completed manager finalization, and verified the
  target version became Final and RAG-published.
- Verified automatic promotion of `Folad-Tabriz.docx` as the active priority-3
  approved reference of the same group. The next target snapshot excludes all
  three active approved references.
- Authenticated testing exposed an M7 blocker: finding/result review actions
  used `window.prompt`/`window.confirm`, which are unsupported in the in-app
  browser and violate the explicit-modal UX requirement. Replaced them with an
  accessible in-product review dialog with explicit close, cancel and submit
  actions, editable notes, corrected-reason validation and persistent-decision
  control.
- Rebuilt the Web image and verified the new dialog in the authenticated UI;
  expert approval now completes successfully without console errors.
- Validation: Next.js production build, TypeScript validation and all 37 static
  routes pass. The rebuilt local Web/API/AI services are healthy.

### Remaining verification and next action

1. Confirm the versioned DOCX/PDF report downloads with a browser surface that
   exposes downloads reliably; the in-app browser did not emit a download event.
2. Continue M7 responsive, keyboard, focus, accessibility and performance
   acceptance for the contract-generation and comparison journeys.
3. Run the full regression suite after the remaining M7 changes, then proceed
   to M8 hardening and release readiness.

## Independent document conformity correction — 2026-08-07

### Completed

- Document conformity master data is presented as a domain independent from
  contract management: document groups, optional important fields/criteria,
  approved group references and versioned rule sets remain isolated from
  contract groups, templates, clauses and contract base documents.
- The document-group editor now saves the group's passing threshold together
  with optional weighted/critical important fields. A group with no optional
  criteria is valid and is scored against its approved references.
- The approved-reference page supports direct PDF/DOCX/image upload or reuse
  of an existing document. An uploaded reference remains unusable until its
  version is extracted, expert-approved, manager-finalized and RAG-published.
- Group comparison now retrieves only active approved references with a Final,
  RAG-published, non-empty extracted version. Ordinary group members are not
  silently treated as authoritative references.
- Per-run user-important instructions are applicable scored findings. Missing,
  different, forbidden and extra findings retain evidence, confidence, exact
  reasons and improvement suggestions.
- A comparison target that is itself an approved reference of the selected
  group is removed from the target selector. The API also returns controlled
  HTTP 400 Persian errors instead of exposing developer stack traces.
- After expert approval and manager finalization, the accepted target is
  automatically added/restored as an active approved reference of the same
  group with the next priority. Rejected or expert-only versions are not
  promoted.
- Approved-reference restoration is idempotent, group membership is ensured,
  and invalid criterion weights or duplicate orders are rejected.
- Development bootstrap now self-heals both required AI settings:
  `ai/embedding.model` and `ai/comparison.prompt`. Missing runtime settings
  produce controlled Persian guidance.
- Runtime testing found and resolved two configuration/usage issues: the local
  Web/API images were stale, and the only approved reference was selected as
  its own target. The local Web/API images were rebuilt and are healthy.
- Validation: Backend regression suite passes 82/82; Next.js production build,
  TypeScript validation, 37-route static generation and `git diff --check`
  pass. The active local database contains an enabled version-1
  `ai/comparison.prompt` row.

### Remaining verification and roadmap work

1. Product owner should complete the authenticated manual scenario with two
   distinct documents: keep `TataboghTest.docx` as the approved reference and
   upload a second document as the target.
2. Verify positive conformity, critical-field rejection, per-run important
   instruction, finding-by-finding expert review, manager finalization and
   automatic promotion of the accepted target.
3. Verify that the next target snapshot includes the newly promoted reference
   and excludes rejected, non-final and non-published versions.
4. Verify versioned DOCX/PDF audit reports in the signed-in UI.
5. After this M5 regression is accepted, continue the existing M7 sequence:
   responsive/accessibility/performance work and authenticated browser
   acceptance; then proceed to M8 hardening and release readiness.

## Intent-first UX correction — 2026-08-06

- The product owner rejected the form-first contract experience. The primary
  journey is now explicitly intent-first: the user writes one Persian request
  containing company, dates, amount and requested clauses.
- Conversation start accepts those structured selectors only as optional API
  hints. It resolves the registered party from the text, infers the contract
  type/internal group from the latest contract, derives the Persian year from
  written dates and selects the effective versioned Template internally.
- Contract group and primary group are implementation concepts for Template
  resolution, approved clauses, access scope and historical matching. They
  must not be exposed as routine fields to the end user.
- The contract-generation start screen no longer asks for party, group, year
  or subject. It presents a single Persian request box and explains the
  automatic resolution steps. The contracts empty state and primary action
  route to this intent-first journey instead of the legacy manual modal.
- Added `/basic-data` as the central hub for parties, contract types,
  Templates, approved clauses, statuses, base documents, years and document
  conformity catalogs.
- At the owner's explicit request, all rows in the standalone `NegareshAI`
  product database were deleted on 2026-08-06 while preserving schema and
  `__EFMigrationsHistory`. Identity, FileManager and other service databases
  were not changed. The reusable reset script is
  `Backend/NegareshAI/scripts/reset-product-data.sql`.
- Validation: NegareshAI API build passes with zero warnings; Next.js
  production build passes and generates 36 routes.
- Follow-up regression on 2026-08-06 added direct coverage for the exact Fasa
  intent-only sentence, including inferred party/group/year, explicit amount,
  requested clause and `10 -> 11` clause count. Template resolution now uses
  the requested start date, only final historical contracts may drive type
  inference, natural Persian `باید باشد/باشه` clause requests are parsed, and
  input-resolution failures return HTTP 400 instead of HTTP 500.
- DOCX generation appends a numbered clause when a Template has no
  `{{newClause}}` placeholder. Clause count falls back to headings extracted
  from the final base document when historical clause rows are unavailable.
- RAG collections are separated by embedding backend as well as model ID to
  prevent vector dimension collisions after backend changes.
- Final regression: backend 61/61 passed; all AI tests 15/15 passed in one
  discovery run; Next.js production build passed with 36 routes; product DB
  row verification remained zero after the requested reset.

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

## Authoritative resume checkpoint — 2026-08-05

This section is the first source of truth for the next development session.
Detailed checkpoints and older session logs below are retained as supporting
history and must not override this section.

### Completed roadmap stages

- M0/M1 are complete: Identity-based action permissions, users/roles, direct
  user grant/deny, role permissions, contract/document group Data Scope and
  the `AdminUser` full-access bootstrap rule are implemented.
- M2 is complete: independent paginated RTL master-data pages, contract and
  document groups, criteria catalogs, per-group weighted/critical criteria,
  prioritized golden documents, versioned/effective contract templates,
  contract years, multiple contract groups and one primary group are
  implemented with activation, audit, soft delete and restore.
- M3 is complete: PDF/DOCX/image ingestion, ordered multi-image pages,
  extraction/OCR, expert review, manager finalization, immutable version
  files, SHA-256 metadata and final-only RAG publication are implemented.
- M4 is complete: persistent multi-turn contract conversations, renewal and
  greenfield generation, deterministic Persian changes, frozen permitted RAG
  sources with page/section citations, explicit cross-group selection,
  structured legal conflict handling, immutable draft versions, PDF/DOCX
  output and requester -> expert -> manager finalization are implemented.
- M5 is complete: final-only prioritized golden/reference snapshots,
  weighted and critical criteria, evidence/citations, two-pass tool/reflection
  trace, expert finding and result decisions, immutable versioned reports,
  corrected-document reruns and separate manager final/RAG publication are
  implemented. Independent RTL comparison, history, review and report routes
  are available.
- M6 is complete: organization/contract-group workflow definitions and risk
  checklists are immutable and versioned; legal, technical, financial, expert
  and manager stages support audited comment, revision, rejection, approval
  and delegation. Deadline, renewal, payment, guarantee, obligation and notice
  operations have completion audit, soft delete/restore, idempotent reminders,
  SQL-backed dashboards and CSV reporting. Six independent paginated RTL
  routes are available.

### M6 acceptance evidence

- Backend regression tests: 56/56 passed, including assignee-only worklists,
  delegation, versioned/critical risk, idempotent reminders and complete
  operation lifecycle coverage.
- Next.js production build passed and generated 34 routes. Authenticated
  browser validation passed for all six M6 routes with RTL layout and no
  console or rendered application errors.
- EF reports no pending model changes. Migration
  `20260805160513_M6WorkflowRiskOperations` is applied to the active SQL Server
  database.
- Authenticated Docker/Identity/SQL acceptance passed: workflow definition
  versions 1/2, five decisions and eight audited actions; weighted risk scores
  59/37 with critical override; reminder run 1 queued two records and run 2
  skipped the same two dedupe keys; real overdue/upcoming/high-risk dashboard
  values, completion audit, update, archive, restore and UTF-8 BOM CSV passed.
- API, AI and Web containers are healthy. No secret, token or connection
  string is recorded in the repository.
- M6 is deterministic operational logic and does not require an AI model call.
  Browser/API tools were used for acceptance; no private contract data was
  sent across an external MCP boundary. Existing M4/M5 AI reflection/tool
  traces remain the correct boundary for evidence-grounded AI work.
- Full evidence is recorded in
  `Docs/NEGARESHAI-ACCEPTANCE-2026-08-05-M6.md`.

### Exact continuation point

The next implementation stage is **M7 — professional UX, performance and accessibility**.
Continue in this order:

1. Build the historical contract/image import wizard and complete Persian
   calendar usage in new M6 forms.
2. Consolidate the chat workspace around sources, questions, calculations,
   diffs and versions without changing the completed M4/M5 lifecycle rules.
3. Complete responsive, keyboard, accessibility and performance budgets for
   the two primary product journeys.
4. Run M7 regression and authenticated browser acceptance before beginning M8.

Before starting M7, read `Docs/NEGARESHAI-PRODUCT-SPEC.md` and the M7 section
of `Docs/NEGARESHAI-ROADMAP.md`. Do not redesign or repeat M0-M6 unless a
regression is proven.

### Working-tree hygiene

At this checkpoint the tracked working tree is clean. These pre-existing local
untracked paths are unrelated to M4 and were intentionally not committed:

- `Backend/NegareshAI/publish/`
- `Backend/Share/tests/`
- root `package-lock.json`

Inspect them separately before any future broad `git add`; never stage them
implicitly.

## Non-negotiable product memory — product owner confirmation 2026-07-30

NegareshAI has exactly two primary product goals:

1. Intelligent contract management.
2. Intelligent document conformity.

The authoritative narratives and acceptance scenarios are recorded under
`تعریف قطعی مالک محصول — ۱۴۰۵/۰۵/۰۸` in
`Docs/NEGARESHAI-PRODUCT-SPEC.md`. Every resumed session must read that section
before planning or implementing work. Infrastructure features are supporting
capabilities and must not displace these two end-to-end flows.

### Product-alignment audit — 2026-07-30

The existing P0-P5 implementation provides useful infrastructure but must not
be treated as final completion against the newly confirmed product definition.
The following gaps are roadmap blockers:

- There is no first-class, tenant-scoped ContractGroup with many-to-many
  contract membership, primary-group selection, effective template versions,
  CRUD/activation/soft-delete/audit and group-level access.
- Upload currently extracts and indexes a document immediately. Extraction/OCR
  may run before approval, but RAG eligibility needs a separate lifecycle and
  must remain disabled until the required final approval.
- DocumentGroup/RuleSet is only an initial slice: it lacks complete CRUD,
  reusable criterion catalog, numeric weights, critical criteria, per-group
  thresholds, golden document versions, expert conflict decisions, group ACL
  and separate permissions for comparison approval versus final/RAG approval.
- Contract generation currently selects a contract and a template explicitly;
  it does not resolve the base contract by company + group + contract year +
  highest version, nor select an effective template from the primary contract
  group.
- Contract generation is a single request/review record rather than a
  persistent multi-turn chat with an immutable version for every correction.
- PDF and DOCX uploads are supported, including scanned PDF OCR, but direct
  JPG/PNG/TIFF multi-page image ingestion is not implemented.
- Document and contract APIs expose basic server-side pagination, but the
  current single-page frontend loads only the first page and renders no
  pagination control. Most management lists remain unpaged.
- Basic data, users/access and organization settings are currently aggregated
  panels in one SPA page. They must become permission-driven parent menus with
  independent child routes/pages and professional list/detail/form UX.
- Several newer P5 endpoints use direct DbContext access in controllers and
  need to be moved to the required MediatR/AutoMapper application architecture.

The next roadmap must be rebuilt around the two owner-approved end-to-end
acceptance scenarios. Do not begin implementation until the remaining product
questions are answered and the resulting roadmap is explicitly approved.

Second product-owner clarification on 2026-07-30 is now recorded in the product
specification. It fixes primary contract groups, effective template selection,
contract year/version resolution, multi-image page ordering, pre-RAG approval,
immutable chat revisions, weighted/critical conformity scoring, catalog-only
criteria, prioritized golden documents, expert conflict decisions, separate
approval permissions and fail-closed comparison groups. A new greenfield
contract scenario was added and still needs its source/template fallback
policy finalized before roadmap approval.

Third and final product-owner clarification on 2026-07-30 closed the remaining
questions: greenfield generation uses the effective group template, approved
clause catalog and user answers; cross-group contracts require explicit user
selection; missing templates fail closed; parties may be created inline with
permission; expert approval always precedes manager finalization; conformity
review and RAG finalization remain separate; and effective authorization is
the intersection of the Healan-style action tree and group data scope.

`Docs/NEGARESHAI-ROADMAP.md` is the approved M0-M8 roadmap. The product owner
approved it and authorized implementation with «شروع کن» on 2026-07-30.

### M0/M1 implementation checkpoint — 2026-07-30

- Added action permissions 6031-6036 and system roles
  `NegareshAIExpert` / `NegareshAIContractManager`; Admin retains every
  NegareshAI permission.
- Added tenant-scoped user/role data-scope assignments for contract and
  document groups with grant/deny, soft delete and complete audit metadata.
- Effective document-group authorization is enforced in group listing and
  comparison start; Admin bypasses data scoping, direct user deny wins, direct
  user grant wins over role evaluation, and default is deny.
- Added paginated CQRS data-scope query/save endpoints and the
  `M1DataScopeAssignments` EF migration.
- Added independent access routes and a dedicated professional RTL
  `/access/group-scopes` page.
- Validation: API and IdentityServer builds pass; API tests pass 24/24;
  frontend production build passes with all access routes generated.
- Runtime: NegareshAI API, AI and Web are healthy; IdentityServer was rebuilt
  and responds on port 5005; the shared local SQL Server remains the database.
- Remaining M0/M1 work: complete the direct-DbContext P5 controller refactor,
  add true server pagination to every remaining management list, implement the
  first-class ContractGroup domain used by contract data scopes, and split the
  four legacy access route bodies into focused list/form experiences.

### M0 CQRS/pagination continuation — 2026-07-30

- Removed the final direct `NegareshDbContext` dependencies from
  `ContractOperationsController` and `ComparisonsController`.
- Moved P5 workflow, risk, operation and management-dashboard use cases plus
  comparison report generation to MediatR handlers.
- Added a regression test that scans every API controller and fails if a
  controller constructor receives `NegareshDbContext`.
- Standardized server pagination for workflows, risks, operations, runtime
  settings, archived documents, comparison history, contract templates,
  RuleSets, document groups and contract catalog lists.
- Document-group pagination applies effective group scope in the SQL query;
  it no longer fetches every group before filtering.
- Frontend API adapters were updated without regressing the current screen
  contracts. Backend tests pass 25/25 and the frontend production build passes.
- Remaining M0 work is frontend modularization/design-system extraction and
  the additive feature-flag/data-migration strategy. Remaining M1 work is the
  ContractGroup domain and focused permission-tree/group-scope UX.

## Authoritative current checkpoint — 2026-07-30

### M2 master-data completion checkpoint — 2026-08-01

- Contract groups are first-class tenant entities; contracts support multiple groups and one required primary group.
- Independent RTL pages exist for contract groups/statuses/parties/base documents/years/templates, document groups, criteria, group criteria, golden documents and versioned RuleSets.
- Criteria are organization catalogs with default weight/criticality; each document group can override weight, criticality and order.
- Golden documents support multiple prioritized references per document group.
- Contract templates are group-owned and versioned with contract year and effective date range; effective selection is fail-closed and chooses the highest active version for primary group and start date.
- Master-data entities use tenant isolation, server pagination where applicable, active/inactive state, soft delete/restore endpoints and audit events.
- Contract create/edit accepts multiple groups and a primary group; the UI requires a primary group and previews the effective template.
- Validation: API tests pass 28/28; Next.js production build passes and generates 21 routes; migrations include `M2MasterDataReferenceModel` and `M2RuleSetLifecycle`.

### Users and access-management completion checkpoint — 2026-08-01

- The Identity UserManager API provides persisted CRUD for users and roles,
  user active/inactive state, soft delete/restore and protected system identities.
  `AdminUser` cannot be disabled or deleted and retains full access to every
  active menu in every registered subsystem.
- User create/edit supports profile data, password rotation and assignment of
  multiple roles. Role create/edit and soft delete/restore are available on an
  independent RTL page.
- Role permissions use the Identity `AccessMenu`/`AccessForm` hierarchy. A
  parent selection applies to its complete subtree and the stored menu IDs are
  validated against the current subsystem.
- Direct user permissions support `inherit`, `grant` and `deny`. Direct deny
  takes precedence over role grants; direct grant can override role evaluation.
- Contract-group and document-group Data Scope can be assigned independently
  to a user or role with grant/deny/inherit. Effective authorization requires
  both the action permission and the resource scope and defaults to deny.
- Independent RTL routes now exist for users, roles, role permissions, direct
  user permissions and group scopes. The permission hierarchy has responsive
  tree styling and explicit grant/deny choices.
- Validation: Identity UserManager build passes; NegareshAI API tests pass
  30/30, including Admin bypass, direct precedence, default deny and independent
  contract/document group scopes; Next.js production build passes and generates
  all 21 routes.

### M3 document-ingestion and approval completion checkpoint — 2026-08-01

- Extraction and RAG publication are now separate operations. Upload and OCR
  can only produce an `Extracted` version; they never index it automatically.
- The persisted version lifecycle is `Uploaded -> Extracted -> ExpertReview ->
  ManagerReview -> Final`, with explicit `Rejected` and `Superseded` states.
  Every expert/manager identity, timestamp and note is audited and retained.
- PDF, DOCX, JPG, PNG and TIFF are supported. Multi-image versions require a
  positive unique page number per image, default to sequential numbering and
  reject mixed/multi-file PDF or DOCX input.
- Every physical version file persists FileManager ID, original name, MIME,
  order, optional page number, byte size and SHA-256. FileManager remains the
  authoritative MIME/malware validation boundary.
- Upload requires one or more active document groups and scope to every group
  selected during registration. Expert and manager decisions require both
  their action permission and effective Data Scope through an assigned group.
- Extracted text and OCR metadata are stored with suggested years, dates,
  amounts, contract numbers, company/party candidates and clause headings for
  expert correction before approval.
- Manager finalization publishes only the approved version with organization,
  document, version, user/group ACL and `approvalState=final` metadata. A newer
  final version deletes the previous vectors and marks it `Superseded`.
- RAG search now requires `approvalState=final`; pre-M3 chunks without this
  marker fail closed and are no longer retrievable.
- Added the independent responsive RTL `/documents/ingestion` workspace for
  upload, page ordering, group selection, extracted-field correction and both
  approval decisions. The document dashboard links to this workspace.
- Applied `M3DocumentIngestionApproval` and `M3LifecycleBackfill` to the active
  local SQL database. Legacy versions are backfilled to Uploaded/Extracted and
  are not treated as final.
- Validation: API build passes with zero warnings; API tests pass 36/36;
  Next.js production build passes with 22 routes; 8/8 AI security/OCR runtime
  tests pass inside the dependency-complete container image. AI/API/Web health
  endpoints and the new UI route return HTTP 200; protected documents return
  HTTP 401 without a token.
- Docker BuildKit produced no log and hit its ten-minute timeout for both AI
  and API/Web builds. For local acceptance, verified Release/standalone outputs
  were assembled into the existing project images through disposable staging
  containers; all three recreated services are healthy and volumes were kept.

### M4 versioned contract conversation completion — 2026-08-01

- Added tenant-owned persistent conversations, ordered user/assistant/system
  messages, clarification records and immutable draft versions. Corrections
  always create a new draft and retain rejected versions for audit.
- Renewal resolution uses organization + directory party + primary contract
  group + requested Persian year, then the highest `Final` document version.
  Tied candidates stop for an explicit contract-number answer; non-final
  versions are excluded from both the new and legacy generation paths.
- Effective templates prefer an exact contract year and then the highest
  active version inside the effective date range. Missing templates fail closed
  with `گروه فاقد قالب معتبر است`.
- Persian date, amount, percentage and direct clause parsing is deterministic.
  A conflicting explicit amount and percentage produces a mandatory question
  showing both calculated values.
- Added the group-owned approved clause catalog with independent RTL CRUD,
  activation, soft delete/restore, audit, pagination and Identity permission
  6037. Greenfield drafts snapshot and inject active approved group clauses.
- Parties can be created inline from the conversation screen; the existing
  `ContractParties` action permission remains the authorization boundary.
- Drafts persist change, calculation, source and template snapshots. The RTL
  `/contract-generation` workspace shows conversation history, clarifications,
  structured diff, calculations and source evidence.
- Enforced requester -> expert -> manager transitions with distinct action
  permissions. Manager finalization creates a `Final` document version,
  supersedes earlier final versions and only then extracts/publishes to RAG.
- Applied `M4ContractConversationLifecycle` and
  `M4ApprovedContractClauseCatalog` to local SQL. NegareshAI API/Web/AI and
  IdentityServer are running locally; both new routes return HTTP 200 and API
  authorization returns HTTP 401 for anonymous requests.
- Validation: API build has zero warnings; tests pass 41/41; Next.js production
  build passes with 24 routes; IdentityServer build passes with only existing
  shared-project warnings.
- Renewal generation now searches only frozen, published `Final` sources and
  persists document/version/page/section/evidence citations. Cross-group RAG
  sources are impossible unless explicitly selected, published and allowed by
  ContractGroup Data Scope; their exact versions are frozen for the conversation.
- Conflict analysis covers date order/duration, amount/percentage choice,
  dispute resolution, termination, obligation and approved-catalog differences.
  Blocking conflicts require an explicit user answer before draft generation.
- Both DOCX and source-backed Persian PDF are generated, stored privately in
  FileManager, downloadable through an authorized API and attached to the final
  document version. The PDF contains contract values, approved/direct clauses,
  structured changes and source citations.
- Finalization deletes vectors for the superseded final version before indexing
  the new manager-approved version. No requester/expert-stage draft is indexed.
- Migrations `M4ConflictAnalysisAndPdf` and `M4FrozenConversationSources` are
  applied to local SQL. Runtime DOCX and PDF endpoints return HTTP 200 and a
  valid `%PDF` payload; API/Web/AI are healthy.
- Final validation: API tests pass 44/44, AI contract/RAG tests pass 8/8,
  Next.js production build passes with 24 routes, and the Fasa renewal,
  Omran Machine greenfield, legal-conflict and explicit cross-group scenarios pass.
- **M4 acceptance is complete.**

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

1. Start M7 professional UX, performance and accessibility from the audited
   roadmap without changing the accepted M4-M6 domain rules.
2. Implement the historical contract/image import wizard and finish Persian
   calendar consistency across the primary journeys.
3. Run responsive, keyboard, accessibility and performance acceptance before
   moving to M8 hardening and release.

## Session log

### 2026-08-05

- Completed M6 workflow, risk and contract operations across the Application
  layer, SQL model, thin HTTP controllers and six paginated RTL routes.
- Added immutable workflow/risk definition versions, five-stage audited
  decisions, comments/delegation, weighted critical assessments, completion
  audit, all six operation types, idempotent reminder worker, scoped dashboard
  and UTF-8 BOM CSV reporting.
- Added migration `20260805160513_M6WorkflowRiskOperations` and six focused
  regression tests; the complete Backend suite passes 56/56 and EF reports no
  pending model changes.
- Authenticated Docker/SQL acceptance and signed-in browser validation passed;
  API, AI and Web containers are healthy and M7 is the exact continuation.
- Completed M5 intelligent document conformity across Backend, AI and the RTL
  frontend workspace.
- Added immutable source/rule/criterion/model/prompt/tool snapshots,
  weighted/critical scoring, citation verification, reusable group conflict
  decisions, result approval and manager-only final/RAG publication.
- Added immutable versioned DOCX/PDF report artifacts and fixed two runtime
  issues found by authenticated acceptance: explicit EF insertion of
  client-keyed report artifacts and full-finding loading before score
  recalculation in request-scoped review handlers.
- Added migration `20260805150445_M5IntelligentDocumentConformity`, 6 M5-focused
  regression tests, AI report/reflection coverage and four comparison routes.
- Authenticated acceptance completed with scores 90/100, critical override,
  expert/manager separation, report signatures and later final-source reuse.

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

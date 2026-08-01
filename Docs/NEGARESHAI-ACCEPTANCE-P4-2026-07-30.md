# NegareshAI M4 Acceptance — completed 2026-08-01

## Implemented scope

- tenant-scoped, versioned organization DOCX templates;
- Persian natural-language ChangeSet parsing;
- deterministic Jalali date, amount and percentage calculations;
- explicit clarification questions instead of guessing missing legal/financial values;
- authorized source, base-version, template, model and prompt snapshots;
- before/after diff and calculation preview;
- private DOCX generation through the AI service;
- human approve/reject decision with audit;
- approved AI draft registered as an immutable document version;
- complete Persian workspace for template upload, source selection, generation and review.
- persistent multi-turn conversations and immutable correction drafts;
- automatic highest-final base selection by party, primary group and Persian year;
- exact-year effective template selection and fail-closed missing-template handling;
- approved group-clause catalog and greenfield generation;
- Final-only RAG retrieval with document/version/page/section citations;
- explicit, Data-Scope checked cross-group sources with frozen versions;
- structured legal/date/amount/termination/obligation conflict analysis;
- requester → expert → manager approval and final-only RAG publication;
- private source-backed DOCX and Persian PDF generation, preview and download.

## Validation

| Check | Result |
|---|---|
| Backend tests | Pass — 44/44 |
| AI contract/RAG runtime tests | Pass — 8/8 |
| Deterministic 25% renewal scenario | Pass — 12,000,000,000 to 15,000,000,000 IRR |
| Missing-value fail-safe | Pass — clarification returned, no guessed value |
| Frontend production build | Pass — Next.js 15.5.21 |
| API Docker image build | Pass |
| Web Docker image build | Pass |
| EF migration scaffold/model build | Pass |
| Fasa renewal with amount conflict and citation | Pass |
| Omran Machine greenfield with approved clause catalog | Pass |
| Explicit cross-group source + Data Scope denial | Pass |
| Runtime DOCX/PDF endpoints | Pass — HTTP 200, valid `%PDF` |

## Runtime status

All M4 migrations are applied to the active local SQL database. NegareshAI
API, AI and Web containers are healthy. The contract generation page is
available at `/contract-generation`; anonymous API access correctly returns
HTTP 401. Secrets and connection strings are not recorded in this document.

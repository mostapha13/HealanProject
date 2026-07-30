# NegareshAI P4 Acceptance — 2026-07-30

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

## Validation

| Check | Result |
|---|---|
| Backend tests | Pass — 21/21 |
| Deterministic 25% renewal scenario | Pass — 12,000,000,000 to 15,000,000,000 IRR |
| Missing-value fail-safe | Pass — clarification returned, no guessed value |
| Frontend production build | Pass — Next.js 15.5.21 |
| API Docker image build | Pass |
| Web Docker image build | Pass |
| EF migration scaffold/model build | Pass |

## Runtime continuation

The existing SQL container is healthy, but no local `.env` provides
`NEGARESHAI_SQL_PASSWORD`. The new images are built. API/Web recreation and
live migration acceptance must run after the operator supplies the existing
database password through `.env`; the credential is not read, printed or
persisted by the implementation session.

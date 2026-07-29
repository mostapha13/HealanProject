# NegareshAI P3 Acceptance — 2026-07-30

## Scope

P3 is complete for document knowledge management and auditable document
comparison:

- document groups and multi-document membership;
- versioned/effective RuleSets, Rules and JSON Parameters;
- group, selected RuleSets, reference document and combined comparison bases;
- reproducible ComparisonRun snapshots;
- evidence-backed findings with page citations, severity, reason, suggestion
  and confidence;
- expert approve, reject and correct decisions;
- history and Persian DOCX/PDF audit reports;
- complete comparison workspace UI.

## Acceptance scenario

The automated scenario uses:

- target: «امیدنامه فولاد دهدشت»;
- document group: «فولادی»;
- a versioned steel prospectus RuleSet;
- reference: «امیدنامه شرکت B»;
- numeric and required-clause rules.

The run records exact target/reference versions, RuleSet version, local model
and prompt version. It produces matched and missing findings, then records an
expert correction with reviewer identity and audit events.

## Results

| Check | Result |
|---|---|
| Backend domain/API/tenant/review suite | Pass — 15/15 |
| AI tenant/ACL/OCR/report runtime suite | Pass — 10/10 |
| Persian semantic retrieval, offline | Pass — Recall@1 100% (5/5) |
| Frontend production build | Pass — Next.js 15.5.21 |
| API/Web/AI Docker image builds | Pass |
| Full EF migration chain on real SQL Server | Pass |
| PDF structural test and visual render QA | Pass |
| DOCX structural/content test | Pass |
| DOCX visual render QA | Not run — LibreOffice unavailable on host |
| `git diff --check` | Pass |

The AI acceptance container ran with networking disabled and loaded BGE-M3 only
from the private model volume. The temporary SQL acceptance container was
removed after the migration test.

## Deployment note

Final P3 images are built locally. The existing long-running local stack was not
recreated because its SQL password was not supplied through an authorized
source. This protects the existing database and does not affect the code,
image-build or isolated SQL acceptance results.

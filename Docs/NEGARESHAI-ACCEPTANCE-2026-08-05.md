# NegareshAI M5 Acceptance — 2026-08-05

Stage: M5 — Intelligent document conformity

Branch: `codex/negareshai-foundation`

Result: PASS

No credentials, tokens or connection strings are recorded in this document.

## Delivered scope

- Final-only prioritized golden and document-group reference selection.
- Frozen source hashes/versions, criteria/weights/critical flags, rules,
  model, prompt and tool/reflection trace for every comparison run.
- Weighted score calculation with an independent critical-failure override.
- Target/reference document, version, page and section evidence.
- Expert finding decisions, run/group conflict-decision persistence and expert
  result approval separated from manager finalization/RAG publication.
- Immutable versioned DOCX/PDF report artifacts with SHA-256 and input snapshot.
- Corrected versions on the same document and later reuse of manager-finalized
  versions as valid group sources.
- Independent RTL routes: `/comparisons`, `/comparisons/history`,
  `/comparisons/review` and `/comparisons/reports`.

## Automated validation

| Check | Result |
|---|---|
| Backend regression suite | PASS — 50/50 |
| AI report/contract/RAG suite | PASS — 11/11 |
| Next.js production build | PASS — 28 routes |
| EF pending model changes | PASS — none |
| Compose configuration | PASS |
| API, AI and Web health | PASS |
| Anonymous comparison request | PASS — rejected with 401 |
| Authenticated comparison access | PASS — 200 |

The active SQL database contains and has applied
`20260805150445_M5IntelligentDocumentConformity`. The report-artifact and
conflict-decision tables were verified after migration.

## Authenticated Docker acceptance

The final acceptance used the real Identity password grant, API, FileManager,
AI extraction/report service, SQL database and RAG publication path. Criterion
tokens were ASCII for shell-encoding stability; Unicode/Persian extraction and
reporting remain covered by the existing ingestion and AI regression suites.

| Scenario | Expected | Actual |
|---|---|---|
| Target missing the critical confidentiality clause | Score 90 and non-compliant critical override | PASS — 90, critical failure true |
| Finding review through separate request scopes | Score remains stable | PASS — 90 remained 90 |
| Corrected version of the document | Score 100 and compliant | PASS — 100, no critical failure |
| Expert result approval | Await manager; do not publish | PASS — ManagerReview, RAG false |
| DOCX report | Valid immutable artifact | PASS — ZIP/`PK` signature |
| PDF report | Valid immutable artifact | PASS — `%PDF` signature |
| Manager finalization | Final and publish to RAG | PASS — approval status ManagerFinalized, RAG true |
| Next group comparison | Retrieve the finalized corrected version as a source | PASS |

## Reflection, tools and MCP boundary

Every run stores a two-pass, evidence-grounded tool strategy:

1. resolve target version and retrieve final-only prioritized sources;
2. evaluate criterion/rule evidence and citations;
3. verify target/reference citations in a reflection pass;
4. recompute the weighted score and critical override.

The trace records these internal tools: target-version resolver, golden-source
retriever, criterion/rule evaluator, citation verifier and weighted-score
calculator. MCP is recorded as unused when private SQL/FileManager/RAG sources
are sufficient. This is intentional: a confidential document is not sent over
an external tool boundary without an explicit need and authorization. MCP can
be enabled later for an approved external authoritative source.

## Runtime defects found and closed

Authenticated acceptance exposed two issues that unit-only execution had not
previously covered:

1. A report artifact with a client-generated Guid could be tracked as an
   existing row, producing an UPDATE and concurrency failure. The handler now
   explicitly adds the artifact and a regression test verifies versions 1/2.
2. Reviewing a non-scorable reference finding in a fresh request scope could
   recalculate against only that finding and reset the score to zero. The
   handler now loads the run's complete finding set before recalculation, with
   request-scoped regression coverage.

The authenticated scenario was rerun after both fixes and passed end to end.

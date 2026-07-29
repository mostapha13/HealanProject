# NegareshAI Acceptance — 2026-07-29

## P2 final acceptance

| Check | Result |
|---|---|
| AI image security, tenant isolation, user/group ACL and citations | Pass — 7/7 |
| Real OCR of an image-only PDF with page metadata | Pass — 1/1 |
| Local Persian semantic retrieval, network disabled | Pass — Recall@1 100% (5/5) |
| Backend regression suite | Pass — 12/12 |
| Frontend production build | Pass — Next.js 15.5.21 |
| Compose configuration | Pass |
| Whitespace/error-marker validation | Pass — `git diff --check` |

The semantic model was loaded only from the private Docker model volume with
`MODEL_OFFLINE`, `HF_HUB_OFFLINE` and `TRANSFORMERS_OFFLINE` enabled. The test
container had `--network none`.

## P3 first slice

- Added document groups and document membership.
- Added versioned RuleSets with effective dates, Rules and JSON Parameters.
- Added authenticated, tenant-scoped create/list APIs and audit records.
- Added the SQL migration and a tenant/versioning regression test.
- Backend regression result after the P3 slice: 13/13.

Remaining P3 work: comparison basis selection, ComparisonRun, Finding,
evidence/confidence, expert decisions and auditable DOCX/PDF reporting.

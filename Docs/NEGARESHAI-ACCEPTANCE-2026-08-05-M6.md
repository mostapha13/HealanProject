# NegareshAI M6 Acceptance — 2026-08-05

Stage: M6 — Contract workflow, risk and operations

Branch: `codex/negareshai-foundation`

Result: PASS

No credentials, tokens or connection strings are recorded in this document.

## Delivered scope

- Immutable versioned workflow definitions at organization or contract-group
  scope.
- Legal, technical, financial, expert and managerial stages with current-user
  worklists, comment, delegation, revision, rejection and approval.
- A separate append-only action trail containing actor, time, comment and
  delegation endpoints.
- Immutable versioned weighted/critical risk checklists and versioned contract
  assessments.
- Deadline, renewal, payment, guarantee, notice and obligation operations with
  assignment, completion actor/time, update, archive and restore.
- Safe background and manually-triggered reminder processing with SQL-level
  dedupe keys.
- Tenant/group-scoped SQL dashboards and downloadable UTF-8 BOM CSV reports.
- Independent paginated RTL routes for worklist, workflow definitions, risks,
  risk checklists, operations and management dashboard.
- Business logic in MediatR Application handlers; controllers remain HTTP
  adapters.

## Automated validation

| Check | Result |
|---|---|
| Backend regression suite | PASS — 56/56 |
| Next.js production build | PASS — 34 routes |
| EF pending model changes | PASS — none |
| Migration | PASS — `20260805160513_M6WorkflowRiskOperations` applied |
| API, AI and Web container health | PASS |
| Anonymous management request | PASS — rejected with 401 |
| Authenticated browser route validation | PASS — six routes, RTL, no UI/console errors |

## Authenticated Docker/SQL acceptance

Acceptance used the real Identity authorization-code/password surfaces, the
running API and Web images, and the persistent local SQL Server database.

| Scenario | Expected | Actual |
|---|---|---|
| Workflow definition revision | Immutable versions sharing one key | PASS — versions 1/2 |
| Five-stage workflow | Legal through manager approval | PASS — completed |
| Comment and delegation | Append-only actor/time/comment audit | PASS — 8 actions total |
| Completed worklist exclusion | No completed workflow in current worklist | PASS |
| Contract final state | Manager approval updates contract | PASS — Approved |
| Risk formula | Weighted SQL-persisted score | PASS — 59 then 37 |
| Critical override | Critical criterion can override numeric level | PASS — Critical at score 59 |
| Risk versioning | New assessment retains prior version | PASS — versions 1/2 |
| Reminder idempotency | Second run does not duplicate | PASS — 2 queued, then 2 skipped |
| Dashboard | Real overdue/upcoming/high-risk counts | PASS — 1/1/1 |
| Completion audit | Actor and UTC time persisted | PASS |
| Operation lifecycle | Create/update/archive/list archived/restore | PASS |
| Workflow/risk archive | Archived list and restore | PASS |
| CSV report | Downloadable and Excel-safe encoding | PASS — UTF-8 BOM, 486 bytes |

## Tool, reflection and MCP boundary

M6 calculations and transitions are deterministic domain logic; introducing a
model call would reduce reliability and is therefore intentionally avoided.
API tooling exercised the full authenticated scenario, and browser tooling
verified the real rendered UI. No external MCP service was necessary, so no
private contract data crossed that boundary. Reflection/tool traces continue
to be persisted where AI actually performs evidence-grounded work in M4/M5.

## Runtime state

`negareshai-api`, `negareshai-ai` and `negareshai-web` are healthy. The final
Web image contains the corrected one-based enum mappings used by the API. The
management dashboard is left available at `http://localhost:3000/management-dashboard`
for manual testing after sign-in.

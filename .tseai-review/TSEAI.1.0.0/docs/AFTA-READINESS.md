# AFTA evaluation readiness — TSEAI

This is an engineering evidence plan for an AFTA assessment, not a claim of certification. The authoritative assessment scope, questionnaire version, product classification and approved laboratory must be confirmed with the commissioning organization and licensed evaluator.

## Implemented technical controls

- Central identity service, short-lived signed access tokens, role/permission authorization and negative admin boundaries.
- Transactional refresh-token rotation, family replay revocation, secure browser cookie flow and explicit logout.
- OTP throttling, global/API rate limiting, bounded payloads and fail-closed production configuration.
- Parameterized/read-only SQL AI boundary; no user-authored SQL, unrestricted MCP tools or public model endpoint.
- Local-only LLM and embedding services; market prompts/data are not sent to an external inference provider.
- Network-isolated Compose services, non-root/read-only application containers, dropped capabilities and no-new-privileges.
- Correlation IDs, security/audit events, incident aggregation, bounded logs and dependency-aware readiness.
- Locked NuGet/npm/Python dependencies, hash-verified Python installation, vulnerability gates and CycloneDX SBOM.
- Automated static security, DAST, prompt/tool injection, authentication, load and backup/restore evidence gates.
- GA promotion is fail-closed when any fresh, version-matched production evidence is absent.

## Environment controls still required

- Classify information assets, owners, confidentiality levels and retention/destruction periods.
- Provision secrets through an approved local secret-management process; document dual control and rotation.
- Use a dedicated SELECT-only SQL AI login and segment SQL/Redis/RabbitMQ/Qdrant/model networks.
- Deploy approved TLS certificates and verify ingress TLS policy, HSTS and administrative access restrictions.
- Forward immutable audit/security logs to the approved local SIEM with synchronized time and retention.
- Establish patch/vulnerability SLAs, incident-response roles, escalation contacts and evidence preservation.
- Exercise backup restoration, rollback, business continuity and disaster recovery under witnessed conditions.
- Perform source, binary/container, DAST and configuration assessment through an authorized evaluator.
- Document personnel access, change approval, release signing, media control and third-party component licensing.

## Evidence bundle

- `artifacts/release-static.json`
- `artifacts/security-static.json`
- `artifacts/sbom.cdx.json`
- `artifacts/runtime-live.json`
- `artifacts/evaluation-live.json`
- `artifacts/conversation-evaluation-live.json`
- `artifacts/performance-live.json`
- `artifacts/security-live.json`
- `artifacts/backup-restore-live.json`
- `artifacts/production-acceptance.json`
- `artifacts/ga-readiness.json`

All live artifacts must be regenerated in the target environment. Development-machine evidence cannot substitute for production acceptance.

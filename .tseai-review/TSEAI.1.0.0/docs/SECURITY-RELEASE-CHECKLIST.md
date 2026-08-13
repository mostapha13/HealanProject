# Security release checklist

## Verified in source and static release gates

- [x] Production startup rejects missing/default/placeholder required configuration.
- [x] JWT signing key policy requires at least 64 bytes; OTP secret is independently configured.
- [x] Refresh tokens rotate transactionally by family; replay revokes the active family.
- [x] Browser refresh token uses HttpOnly, Secure-in-production and SameSite=Strict cookie controls.
- [x] Logout revokes the refresh-token family and expires the cookie.
- [x] Access tokens are memory-only in the web client; legacy local token storage is removed.
- [x] SMS console fallback is disabled in production.
- [x] SQL execution boundaries are read-only/parameterized and reject unsafe statements.
- [x] Saved filters and alerts apply owner isolation; admin operations require authorization policy/permission.
- [x] MCP is disabled by default and constrained by server/tool allow-lists when enabled.
- [x] Reflection is bounded and cannot recursively invoke itself.
- [x] Request body/rate limits, safe error responses, correlation IDs and security headers are enabled.
- [x] Containers run without privilege escalation and with non-root/read-only controls where applicable.
- [x] npm and Python vulnerability audits pass; NuGet/npm/Python dependency graphs are locked.
- [x] CycloneDX SBOM is generated and version-matched.

## Required in the target production environment

- [ ] Generate and inject unique production secrets through the approved secret manager.
- [ ] Remove the bootstrap admin mobile immediately after controlled provisioning.
- [ ] Terminate TLS at the approved ingress and verify HSTS/CSP on the public hostname.
- [ ] Confirm SQL Server, Redis, RabbitMQ and Qdrant are isolated from public networks.
- [ ] Verify the Market/SQL AI credential has SELECT-only permissions on authoritative schemas.
- [ ] Run authenticated OTP abuse, refresh replay, tenant isolation and admin escalation tests.
- [ ] Run DAST including prompt/tool injection, SSRF, invalid-JWT and oversized-body cases.
- [ ] Run the isolated backup/restore drill and `DBCC CHECKDB` verification.
- [ ] Scan the final registry images and sign image/artifact provenance in deployment CI.
- [ ] Retain audit logs and incident evidence according to the approved regulatory policy.

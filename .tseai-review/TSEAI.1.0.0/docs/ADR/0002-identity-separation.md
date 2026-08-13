# ADR-0002: TSEAI Identity is independent

Status: Accepted

TSEAI does not share Healan's identity data, roles or permissions. Healan is used only as a technical reference for OTP and identity patterns. TSEAI owns its identity database, policies and seeds. This prevents cross-product coupling and permits independent scaling and lifecycle management.

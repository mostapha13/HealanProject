# ADR 0004 — Controlled Reflection, Tool Use and MCP

## Decision
TSEAI uses agentic capabilities only when they materially improve correctness.

- Tool execution remains in the trusted .NET orchestration boundary.
- The AI planner proposes intent; it never receives arbitrary SQL/URL execution capability.
- Every internal chat tool is checked by an explicit allow-list policy before execution.
- Reflection is bounded to one review pass and at most one additional knowledge retrieval; recursive self-reflection is forbidden.
- MCP is an optional extension boundary using JSON-RPC `tools/list` and `tools/call`.
- MCP is disabled by default and requires both an allow-listed server configuration and per-server AllowedTools.
- MCP results must still pass application authorization, validation and audit before being exposed to users.

## Why now
Sprint 10 introduced orchestration, so adding these boundaries before production hardening prevents an unsafe direct-agent architecture from becoming entrenched.

## Non-goals
No autonomous trading, order submission, arbitrary shell/code execution, unrestricted web browsing, dynamic SQL execution or user-supplied MCP endpoints.

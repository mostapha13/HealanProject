# ADR 0009 — Secure Structured Tool Boundary

TSEAI does not expose arbitrary SQL, table names, URLs, or MCP calls to the LLM. Structured market access is performed only through a fixed registry of strongly typed tools. Each tool resolves entities against authoritative SQL AI reference data, uses parameterized/read-only gateways, applies bounded execution, and may enforce Data Quality/Freshness before returning facts.

The initial Sprint 17 registry is: `entity.resolve`, `market.get_symbol_snapshot`, `market.get_order_book`, `market.get_client_type`, `market.get_summary`, `market.get_indexes`, and `market.get_instrument`.

Unknown tools fail closed. Ambiguous entities fail closed. A rejected market quality report cannot be bypassed by Chat composition or reflection.

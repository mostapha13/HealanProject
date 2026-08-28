# ADR 0019 — Bounded semantic question compiler

## Decision

When the exact canonical SQL reference layer cannot interpret a Persian question, TSEAI invokes a bounded local semantic compiler before capability routing. The compiler does not answer, execute SQL or select arbitrary tools. It emits a validated frame containing domain, operation, copied entity surfaces, requested metrics, temporal wording, response shape, confidence, ambiguity and one canonical standalone Persian question.

Existing deterministic parsers remain the fast path. Questions already covered by the market ontology, entity-aware news/descriptive routing or comparison logic do not pay an additional model call.

## Trust boundary

- JSON keys, enums, metrics, lengths and cardinalities are allow-listed.
- Every entity must occur in both the original and rewritten question.
- The rewrite must retain lexical overlap with the original request.
- The compiler cannot emit SQL, table names as execution input, URLs or tool names.
- A high-confidence structured frame that still has no typed SQL answer fails closed; it cannot fall through to general RAG.
- Genuine ambiguity produces one concise clarification. Colloquial wording alone is not ambiguity.
- The compiler is local and optional. Failure returns control to the existing deterministic router.

## Consequences

Equivalent Persian formulations can converge on the same typed query without growing an unbounded phrase list. RAG remains available for descriptive/history/news questions, while counts, identities, organization relations, company state and other structured claims stay evidence-first. Semantic metadata is supplied to the bounded final reviewer so requested output shape is part of acceptance.

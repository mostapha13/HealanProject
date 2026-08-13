# Sprint 20 Validation

Required gates:
- detector recognizes direct DSL and explicit Persian filter commands;
- single-symbol / generic structured questions are not intercepted;
- DSL is deterministic parser/AST validated;
- unsupported/historical `[ih]` paths fail closed;
- direct DSL is stored in conversation state;
- Quality Gate remains in FilterExecutionService;
- Chat tool policy explicitly allow-lists `filter.chat`;
- no arbitrary SQL/URL/MCP execution is added.

# Sprint 3 — TSETMC Simple Filter Core
Delivered a safe deterministic pipeline: `TSETMC DSL → Lexer → Parser → AST → Validator → Evaluator → Market Snapshot`.
- No JavaScript `eval`.
- Arithmetic, comparisons, `&&`, `||`, `!`, parentheses and numeric underscores.
- Strings: `.indexOf()`, `.length`, string index access.
- Allowed `Math.*` functions from TSETMC guide.
- Current-day TSETMC fields, five order-book levels and `(ct)` client-type properties.
- Parse and execute APIs.

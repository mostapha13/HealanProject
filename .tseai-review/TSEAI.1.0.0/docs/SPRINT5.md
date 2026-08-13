# Sprint 5 — Persian Natural-Language Filter Builder
Pipeline: `Persian request → AI planner proposal → deterministic TSETMC import/validation → canonical export → filter execution`.
The AI planner never executes SQL or JavaScript and cannot bypass the backend field registry.
V1 high-confidence Persian rules include real-person buy/sell volume ratio, buyer power, buy queue, trade value with IRR/Toman normalization, last-vs-close, volume-vs-base, trade count, first-vs-yesterday and symbol-prefix filters. Multiple recognized clauses are combined with AND.
Chat `/api/chat/ask` reserves quota before processing, releases it on unsupported/internal failure, and returns canonical TSETMC code plus matched symbols on success.
Frontend now provides a functional RTL filter-chat surface.

- Optional configurable LLM fallback handles requests outside deterministic Persian patterns; its output is never trusted until Backend TSETMC validation passes.
- Admin basic-settings form manages guest/user daily quotas and market start/end/poll interval.

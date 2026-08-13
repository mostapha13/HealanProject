# TSEAI — Post-RC Intelligence Roadmap

The SQL AI landing database is assumed to be continuously refreshed by external jobs. Sprint 13 establishes the canonical boundary. The following roadmap turns those facts into a high-accuracy Persian market-intelligence chatbot.

| Sprint | Scope |
|---|---|
| 13 | Canonical Data Foundation — **implemented** |
| 14 | Persian Temporal Intelligence Engine — **implemented** |
| 15 | Persian Entity & Instrument Resolver — **implemented** |
| 16 | Data Quality & Freshness Engine — **implemented** |
| 17 | Secure Structured Tool Gateway — **implemented** |
| 18 | Deterministic Market Analytics Engine — **implemented** |
| 19 | Natural-Language Structured Query — **implemented** |
| 20 | Chat-integrated TSETMC Filter Builder — **implemented** |
| 21 | Conversational Filter Editing — **implemented** |
| 22 | Filter + Temporal Integration — **implemented** |
| 23 | Saved Filters & Alerts through Chat — **implemented** |
| 24 | Knowledge Ingestion & Content Intelligence — **implemented** |
| 25 | Advanced Hybrid Retrieval — **implemented** |
| 26 | Intent & Capability Router — **implemented** |
| 27 | Multi-Tool Hybrid Planner — **implemented** |
| 28 | Conversational Context Intelligence — **implemented** |
| 29 | Temporal Conversation Context |
| 30 | Evidence & Citation Engine |
| 31 | Answer Validation & Hallucination Guard |
| 32 | Persian Financial Answer Composer |
| 33 | Rich Chat UI |
| 34 | AI Admin & Semantic Registry |
| 35 | Golden Question Dataset |
| 36 | AI Evaluation & Release Gate |
| 37 | Performance & Cache |
| 38 | Security / Agentic Governance |
| 39 | Production E2E Acceptance |
| 40 | TSEAI 1.0 Final |

## Core non-negotiable capabilities

### Persian temporal resolution
The user may express dates as `امروز`, `فردا`, `پس فردا`, `دیروز`, `4 روز بعد`, `چهار روز قبل`, `20/05/1405`, `1405/05/20`, `20 مرداد 1405`, `بیست مرداد 1405`, ranges and conversational relative references. Resolution is deterministic and produces a canonical temporal contract; future data is never fabricated.

### Filters inside Chat
The existing safe TSETMC Filter Engine remains authoritative. Chat adds natural-language build/edit/execute/save/alert workflows over the canonical AST. The LLM never executes JavaScript or arbitrary SQL. Historical `[ih]` requests fail closed until `MarketDailyHistory` becomes available.

### Accuracy first
Structured facts are read through typed tools, numeric calculations are deterministic, RAG is evidence-backed, and every final factual answer passes entity/temporal/freshness/evidence validation before release.



## Progress update
Sprints 13–30 are complete through `1.0.0-rc.19`.

### Sprint 28 — COMPLETE
Conversational Context Intelligence adds Redis-backed referent memory, deterministic follow-up routing, explicit correction, and two-symbol current-market comparison. Context never stores stale market facts; every market follow-up re-enters Structured Tool Gateway and Data Quality/Freshness gates.

Next execution target: Sprint 31 — Answer Validation & Hallucination Guard.

### Sprint 29 — COMPLETE
Temporal Conversation Context: contextual relative-date/range chaining, real-clock rebase, explicit temporal comparison recognition, and missing-anchor fail-closed behavior.

### Sprint 30 — COMPLETE
Evidence & Citation Engine: unified provenance, deterministic citation labels, structured/RAG authority separation and citation consistency validation.

### Sprint 31 — NEXT
Answer Validation & Hallucination Guard.

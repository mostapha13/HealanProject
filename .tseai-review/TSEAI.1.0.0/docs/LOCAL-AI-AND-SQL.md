# Local AI and SQL Server profile

## Selected local models

- Chat/planner: `Qwen3.5-4B-UD-Q4_K_XL.gguf` (Apache-2.0 upstream; text-only local use).
- Retrieval embeddings: `Qwen3-Embedding-0.6B-Q8_0.gguf` (official Qwen GGUF, 1024 dimensions).
- Runtime: digest-pinned `llama.cpp` CUDA server with OpenAI-compatible internal endpoints.

This pairing fits the assessed workstation (RTX 3050 Laptop 6 GB, 16 GB RAM) while keeping prompts and market data on the local machine. The LLM exposes two parallel decode slots with continuous batching. The application tier may serve 20 concurrent users, but generative fallback requests are queued; they are not 20 simultaneous GPU generations.

Local verification on 2026-08-12 confirmed both checksum-pinned models load concurrently with CUDA 12.8.1. Combined GPU usage was approximately 5,194 MiB of 6,144 MiB. A short Persian response completed in 3.78 seconds; a two-text embedding request completed in 2.02 seconds and returned two 1,024-dimensional vectors. Directly flooding the two-slot model with 20 simultaneous generations made the already heavily loaded local Docker engine unresponsive, so the AI application now enforces a two-request inference semaphore, a 15-second bounded queue and fail-closed fallback when the model is busy or unavailable.

Download and checksum-verify both files:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/download-local-models.ps1
```

The model directory is excluded from Git, Docker build contexts and release ZIPs. Compose mounts it read-only. Neither inference service publishes a host port.

## Observed local SQL AI compatibility

Read-only assessment of `LAPTOP-VECKM0LE\MSSQL`, database `AI`, found 25 tables. The active datasets include 75,238 instruments, 61,857 content rows, 5,840 `TseFaq` rows, 2,815 order-book levels, 1,880 client-type rows and 567 cash-market snapshots.

The adapter accounts for the source spellings `marketcatery`, `MarketCateryId`, `Marketcatery`, `EDeliveryCatery`, `ContentId`, `Dalil`, `Vaziyatdesc`, `Namad` and `companyName`. It also ingests populated `TseFaq` as a safe fallback while the separate `FAQ` table is empty.

`Marketsummary`, `IndexLastLive`, `ContentType`, `FAQ` and `EDeliveryObject` were empty during assessment. Empty sources remain fail-closed and are never represented as zero-valued market facts.

No indexes were found on the main read-model tables. The idempotent DBA-reviewed recommendations are in `deploy/sql/sql-ai-readonly-indexes.sql`; they have deliberately not been executed against the source database.

## Container access to host SQL Server

Windows Integrated Security used by the desktop account does not automatically flow into Linux containers. A dedicated SQL login named `tseai` is now mapped only to `AI`, belongs to `db_datareader`, and has explicit `INSERT`, `UPDATE`, `DELETE` and `EXECUTE` denials. Put its secret only in the uncommitted `.env.production` connection strings. Do not use `sa` or an application owner login for SQL AI reads.

Host and Linux-container authentication were verified against 75,238 `Instrument` rows. The named instance now listens on the fixed Compose port `14330`; the idempotent `scripts/configure-local-sql-port.ps1` helper reports `AlreadyConfigured` on repeat runs and does not restart the service unnecessarily. The requested password is too weak for an enterprise/AFTA environment and must be rotated before production evidence can pass.

## Capacity baseline

- Initial target: 20 concurrent application users.
- LLM decode parallelism: 2, total context budget 8,192 tokens.
- Embedding parallelism: 2, total context budget 8,192 tokens.
- Application-side LLM concurrency: 2; bounded queue timeout: 15 seconds; request timeout: 45 seconds.
- Deterministic planners remain the primary path; the local LLM is a bounded fallback and all generated filters pass authoritative validation.
- Final p95/p99 limits must be measured with the production E2E/load gate after SQL credentials are provisioned.

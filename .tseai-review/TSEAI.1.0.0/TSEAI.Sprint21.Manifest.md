# TSEAI Sprint 21 Manifest

- Version: `1.0.0-rc.10`
- Baseline: Sprint 20 / `1.0.0-rc.9`
- Capability: Conversational Filter Editing
- Core service: `ConversationFilterService`
- Deterministic planner: `AI/tseai-ai/app/conversation_filter_planner.py`
- Chat routing: `ChatIntegratedFilterService`
- State: Redis-backed `IConversationFilterStateStore` + per-conversation lock
- Release validator: `scripts/validate-sprint21.py`
- Runtime smoke: `TSEAI.ConversationalFilter.SmokeTests`

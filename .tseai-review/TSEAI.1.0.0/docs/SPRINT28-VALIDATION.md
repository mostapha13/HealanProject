# Sprint 28 Validation

Required gates:
- Sprint validators 7→28 PASS.
- Conversation-context corpus covers market, knowledge, hybrid, comparison and correction follow-ups.
- `TSEAI.ConversationContext.SmokeTests` PASS on a .NET-capable machine.
- Redis context TTL and namespaced key verified.
- No market numeric fact is persisted in conversation context.
- Comparison uses Structured Tool Gateway + Quality Gate for both instruments.
- Python AI regressions remain green.

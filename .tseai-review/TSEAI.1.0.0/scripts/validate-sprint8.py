from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
def text(path): return (root/path).read_text(encoding='utf-8')

program=text('Backend/Platform/src/TSEAI.Api/Program.cs')
service=text('Backend/Platform/src/TSEAI.Application/Alerts/AlertRuleService.cs')
repo=text('Backend/Platform/src/TSEAI.Infrastructure/Alerts/EfAlertRepository.cs')
schema=text('Backend/Platform/src/TSEAI.Infrastructure/Persistence/AlertSchemaInitializer.cs')
market=text('Backend/MarketRuntime/src/TSEAI.MarketRuntime.Worker/MarketRuntimeWorker.cs')
market_store=text('Backend/MarketRuntime/src/TSEAI.MarketRuntime.Worker/RedisMarketSnapshotStore.cs')
redis_store=text('Backend/Alerts/src/TSEAI.Alert.Worker/AlertRedisStore.cs')
evaluator=text('Backend/Alerts/src/TSEAI.Alert.Worker/AlertEvaluationWorker.cs')
outbox=text('Backend/Alerts/src/TSEAI.Alert.Worker/AlertOutboxPublisherWorker.cs')
publisher=text('Backend/Alerts/src/TSEAI.Alert.Worker/RabbitMqAlertPublisher.cs')
consumer=text('Backend/Notification/src/TSEAI.Notification.Api/Alerts/RabbitMqAlertConsumer.cs')
notify_program=text('Backend/Notification/src/TSEAI.Notification.Api/Program.cs')
compose=text('docker-compose.yml')
ui=text('Frontend/src/App.jsx')
cases=json.loads(text('tests/alert-engine-cases.json'))
assert len(cases) >= 15

for route in ['MapGroup("/api/alerts")', 'MapPost("/"', 'MapPut("/{id:guid}"', 'MapDelete("/{id:guid}"', 'MapGet("/events/recent"', 'MapPost("/events/{eventId:guid}/read"']:
    assert route in program, route
assert 'RequireClaim("permission", "Alert.Create")' in program
assert 'never consume Chat quota' in program
assert 'OwnerUserId == ownerUserId' in repo and repo.count('OwnerUserId == ownerUserId') >= 5
assert 'SavedFilterOwnedAsync' in service and 'SavedFilterVersionExistsAsync' in service
assert 'FollowLatestVersion' in service and 'PinnedFilterVersion' in service
assert 'Alerts.MaxPerUser' in text('Backend/Platform/src/TSEAI.Domain/Settings/SystemSetting.cs')

for table in ['AlertRules','AlertEvents','AlertOutbox']:
    assert f"[dbo].[{table}]" in schema
assert 'rowversion NOT NULL' in schema
assert 'UQ_AlertOutbox_Event' in schema

assert 'PublishChangesAsync' in market and 'MarketChangeKind.Current' in market and 'MarketChangeKind.ClientType' in market and 'MarketChangeKind.OrderBook' in market
assert 'StreamAddAsync' in market_store and 'tseai:market:changes:v1' in market_store
assert 'StreamCreateConsumerGroupAsync' in redis_store
assert 'StreamAutoClaimAsync' in redis_store
assert 'Environment.MachineName' in redis_store
assert 'previous == current' in redis_store and "current == '1'" in redis_store
assert 'filterVersion' in redis_store and 'tradingDate' in redis_store
assert 'CouldAffect' in evaluator and 'FilterEvaluator' in evaluator
assert 'AlertEvents.Add' in evaluator and 'AlertOutbox.Add' in evaluator and 'BeginTransactionAsync' in evaluator
assert 'RollbackTriggerAsync' in evaluator

assert 'publisherConfirmationsEnabled: true' in publisher and 'publisherConfirmationTrackingEnabled: true' in publisher
assert 'mandatory: true' in publisher
assert 'LeaseKey' in outbox and 'When.NotExists' in outbox and 'ReleaseLeaseScript' in outbox
assert 'PublishedAtUtc = DateTime.UtcNow' in outbox

assert 'BasicQosAsync' in consumer and 'autoAck: false' in consumer
assert 'When.NotExists' in consumer and 'KeyDeleteAsync(dedupKey)' in consumer
assert 'BasicNackAsync' in consumer and 'requeue: true' in consumer
assert 'SendAsync("alertTriggered"' in consumer
assert 'AddSignalR().AddStackExchangeRedis' in notify_program
assert 'MapHub<AlertHub>("/hubs/alerts")' in notify_program
assert 'StartsWithSegments("/hubs/alerts")' in notify_program

assert 'alert-engine:' in compose and 'RabbitMq__Exchange: tseai.alerts' in compose
assert 'Alerts__PendingClaimIdleMilliseconds' in compose and 'Alerts__OutboxLeaseSeconds' in compose
assert '/notifications/hubs/alerts' in ui and 'withAutomaticReconnect' in ui
assert 'هشدارهای بازار' in ui and 'دنبال‌کردن آخرین نسخه فیلتر' in ui
assert 'Alerts.MaxPerUser' in ui and 'Alerts.DefaultCooldownSeconds' in ui
print('TSEAI Sprint 8 alert-engine invariants: OK')

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using TSEAI.Application.Filters.Execution;
using TSEAI.Domain.Alerts;
using TSEAI.Infrastructure.Persistence;
using TSEAI.Shared.Application.Alerts;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Alert.Worker;

public sealed class AlertEvaluationWorker(
    AlertRedisStore redis,
    AlertRuleCache rules,
    IServiceScopeFactory scopes,
    IOptions<AlertEngineOptions> options,
    ILogger<AlertEvaluationWorker> log) : BackgroundService
{
    private readonly AlertEngineOptions _options = options.Value;
    private readonly FilterEvaluator _evaluator = new();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await redis.EnsureConsumerGroupAsync();
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var entries = await redis.ReadOwnPendingAsync();
                if (entries.Length == 0) entries = await redis.ReclaimAbandonedAsync();
                if (entries.Length == 0) entries = await redis.ReadNewAsync();
                if (entries.Length == 0)
                {
                    await Task.Delay(Math.Max(50, _options.IdleDelayMilliseconds), stoppingToken);
                    continue;
                }

                foreach (var entry in entries)
                {
                    await ProcessEntryAsync(entry, stoppingToken);
                    await redis.AcknowledgeAsync(entry.Id);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex)
            {
                log.LogError(ex, "Alert evaluation loop failed");
                await Task.Delay(1000, stoppingToken);
            }
        }
    }

    private async Task ProcessEntryAsync(StreamEntry entry, CancellationToken ct)
    {
        var batch = AlertRedisStore.ParseBatch(entry);
        if (batch is null || batch.Changes.Count == 0) return;

        var ruleSet = await rules.GetAsync(ct);
        if (ruleSet.Count == 0) return;
        var snapshots = await redis.GetSnapshotsAsync(batch.Changes.Select(x => x.InsCode));
        if (snapshots.Count == 0) return;

        var changedByCode = batch.Changes.ToDictionary(x => x.InsCode, x => x.Kind);
        var triggers = new List<(AlertRuleSnapshot Rule, MarketSymbolSnapshot Snapshot)>();

        foreach (var rule in ruleSet)
        {
            foreach (var snapshot in snapshots.Values)
            {
                if (snapshot.TradingDate != batch.TradingDate) continue;
                var kind = changedByCode.GetValueOrDefault(snapshot.InsCode);
                if (!CouldAffect(rule, kind)) continue;

                bool current;
                try { current = _evaluator.Evaluate(rule.Ast, snapshot); }
                catch (Exception ex)
                {
                    log.LogDebug(ex, "Alert {AlertId} evaluation failed for {InsCode}", rule.AlertRuleId, snapshot.InsCode);
                    current = false;
                }

                if (await redis.TryTransitionAsync(rule.AlertRuleId, rule.FilterVersion, batch.TradingDate,
                        snapshot.InsCode, current, rule.CooldownSeconds))
                    triggers.Add((rule, snapshot));
            }
        }

        if (triggers.Count == 0) return;
        try
        {
            await PersistTriggersAsync(triggers, ct);
        }
        catch
        {
            foreach (var (rule, snapshot) in triggers)
            {
                try { await redis.RollbackTriggerAsync(rule.AlertRuleId, rule.FilterVersion, batch.TradingDate, snapshot.InsCode); }
                catch (Exception rollbackEx) { log.LogWarning(rollbackEx, "Alert state rollback failed"); }
            }
            throw;
        }
    }

    private static bool CouldAffect(AlertRuleSnapshot rule, MarketChangeKind kind)
    {
        if ((kind & MarketChangeKind.Current) != 0) return true;
        if ((kind & MarketChangeKind.ClientType) != 0 && rule.Dependencies.ClientType) return true;
        if ((kind & MarketChangeKind.OrderBook) != 0 && rule.Dependencies.OrderBook) return true;
        return false;
    }

    private async Task PersistTriggersAsync(IReadOnlyList<(AlertRuleSnapshot Rule, MarketSymbolSnapshot Snapshot)> triggers, CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var (rule, snapshot) in triggers)
        {
            var eventId = Guid.NewGuid();
            var message = BuildMessage(rule, snapshot);
            var domainEvent = new AlertEvent
            {
                Id = eventId,
                AlertRuleId = rule.AlertRuleId,
                OwnerUserId = rule.OwnerUserId,
                SavedFilterId = rule.SavedFilterId,
                FilterVersion = rule.FilterVersion,
                InsCode = snapshot.InsCode,
                SymbolCode = snapshot.SymbolCode,
                Symbol = snapshot.Symbol,
                SymbolName = snapshot.SymbolName,
                AlertName = rule.AlertName,
                FilterName = rule.FilterName,
                TsetmcCode = rule.TsetmcCode,
                PersianExplanation = rule.PersianExplanation,
                Message = message,
                LastPrice = snapshot.LastPrice,
                ClosingPrice = snapshot.ClosingPrice,
                TradeVolume = snapshot.TradeVolume,
                TradeValue = snapshot.TradeValue,
                TradingDate = snapshot.TradingDate,
                TriggeredAtUtc = now
            };
            var contract = new AlertTriggeredMessage(
                eventId, rule.AlertRuleId, rule.SavedFilterId, rule.FilterVersion, rule.OwnerUserId,
                snapshot.InsCode, snapshot.SymbolCode, snapshot.Symbol, snapshot.SymbolName,
                rule.AlertName, rule.FilterName, rule.TsetmcCode, rule.PersianExplanation, message,
                snapshot.LastPrice, snapshot.ClosingPrice, snapshot.TradeVolume, snapshot.TradeValue,
                snapshot.TradingDate, now);
            db.AlertEvents.Add(domainEvent);
            db.AlertOutbox.Add(new AlertOutbox
            {
                AlertEventId = eventId,
                EventType = "alert.triggered",
                PayloadJson = JsonSerializer.Serialize(contract),
                CreatedAtUtc = now
            });
        }
        await db.SaveChangesAsync(ct);

        foreach (var id in triggers.Select(x => x.Rule.AlertRuleId).Distinct())
            await db.AlertRules.Where(x => x.Id == id).ExecuteUpdateAsync(
                s => s.SetProperty(x => x.LastTriggeredAtUtc, now).SetProperty(x => x.UpdatedAtUtc, now), ct);

        await tx.CommitAsync(ct);
    }

    private static string BuildMessage(AlertRuleSnapshot rule, MarketSymbolSnapshot snapshot) =>
        $"هشدار «{rule.AlertName}»: نماد {snapshot.Symbol} با فیلتر «{rule.FilterName}» منطبق شد. " +
        $"آخرین قیمت {MoneyFormatter.FormatIrr(snapshot.LastPrice)}، ارزش معاملات {MoneyFormatter.FormatIrr(snapshot.TradeValue)}.";
}

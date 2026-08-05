using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.ContractOperations;

public interface IContractOperationReminderProcessor
{
    Task<ReminderRunResult> ProcessOrganizationAsync(
        Guid organizationId, DateOnly asOf, CancellationToken cancellationToken);
    Task ProcessAllAsync(DateOnly asOf, CancellationToken cancellationToken);
}

public sealed class ContractOperationReminderProcessor(NegareshDbContext db)
    : IContractOperationReminderProcessor
{
    public async Task<ReminderRunResult> ProcessOrganizationAsync(
        Guid organizationId, DateOnly asOf, CancellationToken cancellationToken)
    {
        var operations = await db.ContractOperations
            .Where(x => x.OrganizationId == organizationId
                && (x.Status == ContractOperationStatus.Pending
                    || x.Status == ContractOperationStatus.Overdue))
            .ToListAsync(cancellationToken);
        var keys = operations.SelectMany(x => CandidateKeys(x, asOf))
            .Select(x => x.Key).ToHashSet(StringComparer.Ordinal);
        var existing = await db.ContractOperationReminders.AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && keys.Contains(x.DedupeKey))
            .Select(x => x.DedupeKey).ToHashSetAsync(cancellationToken);
        var marked = 0;
        var upcoming = 0;
        var overdue = 0;
        var skipped = 0;
        foreach (var operation in operations)
        {
            if (operation.Status == ContractOperationStatus.Pending && operation.DueDate < asOf)
            {
                operation.Status = ContractOperationStatus.Overdue;
                operation.UpdatedAtUtc = DateTime.UtcNow;
                operation.UpdatedByUserId = "system:operation-reminder";
                marked++;
            }
            foreach (var candidate in CandidateKeys(operation, asOf))
            {
                if (!existing.Add(candidate.Key)) { skipped++; continue; }
                db.ContractOperationReminders.Add(new ContractOperationReminder
                {
                    OrganizationId = organizationId,
                    ContractOperationId = operation.Id,
                    DedupeKey = candidate.Key,
                    Kind = candidate.Kind,
                    ScheduledFor = candidate.ScheduledFor
                });
                if (candidate.Kind == OperationReminderKind.Upcoming) upcoming++;
                else overdue++;
            }
        }
        if (marked + upcoming + overdue > 0)
            db.AuditLogs.Add(new AuditLog
            {
                OrganizationId = organizationId,
                UserId = "system:operation-reminder",
                Action = "operation-reminders.processed",
                EntityType = nameof(ContractOperationReminder),
                MetadataJson = JsonSerializer.Serialize(new
                { AsOf = asOf, MarkedOverdue = marked, UpcomingQueued = upcoming,
                    OverdueQueued = overdue, ExistingSkipped = skipped })
            });
        await db.SaveChangesAsync(cancellationToken);
        return new(asOf, marked, upcoming, overdue, skipped);
    }

    public async Task ProcessAllAsync(DateOnly asOf, CancellationToken cancellationToken)
    {
        var organizations = await db.Organizations.AsNoTracking()
            .Select(x => x.Id).ToArrayAsync(cancellationToken);
        foreach (var organizationId in organizations)
            await ProcessOrganizationAsync(organizationId, asOf, cancellationToken);
    }

    private static IEnumerable<(string Key, OperationReminderKind Kind,
        DateOnly ScheduledFor)> CandidateKeys(ContractOperation operation, DateOnly asOf)
    {
        if (operation.Status == ContractOperationStatus.Pending)
        {
            var scheduled = operation.DueDate.AddDays(-operation.ReminderDaysBefore);
            if (scheduled <= asOf && operation.DueDate >= asOf)
                yield return ($"upcoming:{operation.Id:N}:{scheduled:yyyyMMdd}",
                    OperationReminderKind.Upcoming, scheduled);
        }
        if ((operation.Status == ContractOperationStatus.Overdue
                || operation.Status == ContractOperationStatus.Pending)
            && operation.DueDate < asOf)
            yield return ($"overdue:{operation.Id:N}:{operation.DueDate:yyyyMMdd}",
                OperationReminderKind.Overdue, operation.DueDate);
    }
}

public sealed class ContractOperationReminderWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ContractOperationReminderWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var processor = scope.ServiceProvider
                    .GetRequiredService<IContractOperationReminderProcessor>();
                await processor.ProcessAllAsync(
                    DateOnly.FromDateTime(DateTime.UtcNow), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Contract operation reminder job failed.");
            }
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }
}

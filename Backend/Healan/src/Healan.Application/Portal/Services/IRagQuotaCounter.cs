namespace Healan.Application.Portal.Services;

public interface IRagQuotaCounter
{
    Task<int> GetUsedTodayAsync(Guid? identityUserId, string? guestKey, CancellationToken cancellationToken);
    Task<int> IncrementTodayAsync(Guid? identityUserId, string? guestKey, CancellationToken cancellationToken);
}

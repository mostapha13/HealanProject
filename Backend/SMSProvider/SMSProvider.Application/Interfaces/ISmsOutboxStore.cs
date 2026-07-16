using SMSProvider.Application.Entities;

namespace SMSProvider.Application.Interfaces;

public interface ISmsOutboxStore
{
    Task SaveAsync(SmsOutboxLog log, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<SmsOutboxLog> Items, int TotalCount)> ListPagedAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? phoneNumber = null,
        CancellationToken cancellationToken = default);
}

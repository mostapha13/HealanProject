using SMSProvider.Application.Entities;

namespace SMSProvider.Application.Interfaces;

public interface ISmsOutboxStore
{
    Task SaveAsync(SmsOutboxLog log, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SmsOutboxLog>> ListAsync(
        int take = 100,
        string? phoneNumber = null,
        CancellationToken cancellationToken = default);
}

using SMSProvider.Application.Models;

namespace SMSProvider.Application.Interfaces;

public interface ISmsDispatchService
{
    /// <summary>
    /// Enqueues SMS for async delivery (RabbitMQ) or sends immediately when broker is disabled.
    /// </summary>
    /// <returns>Response and whether the message was queued (outbox is written by the consumer).</returns>
    Task<(SendSmsResponse Response, bool Queued)> DispatchAsync(
        SendSmsRequest request,
        CancellationToken cancellationToken = default);
}

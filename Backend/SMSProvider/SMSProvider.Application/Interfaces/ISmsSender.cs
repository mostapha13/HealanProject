using SMSProvider.Application.Models;

namespace SMSProvider.Application.Interfaces;

public interface ISmsSender
{
    Task<SendSmsResponse> SendAsync(SendSmsRequest request, CancellationToken cancellationToken = default);
}

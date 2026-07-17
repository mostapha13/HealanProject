using Healan.Application.Portal.Messages;

namespace Healan.Application.Portal.Services;

public interface IRagChatLogPublisher
{
    void Publish(RagChatLogMessage message);
}

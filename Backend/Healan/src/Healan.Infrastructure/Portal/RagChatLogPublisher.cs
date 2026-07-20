using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Messages;
using Healan.Application.Portal.Services;
using Healan.Domain.Portal.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Healan.Infrastructure.Portal;

/// <summary>
/// Persist chat logs directly to SQL so clinic «گفتگوهای دستیار» works even when RabbitMQ is disabled.
/// </summary>
public sealed class RagChatLogPublisher : IRagChatLogPublisher
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RagChatLogPublisher> _logger;

    public RagChatLogPublisher(IServiceScopeFactory scopeFactory, ILogger<RagChatLogPublisher> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public void Publish(RagChatLogMessage message)
    {
        if (message is null || string.IsNullOrWhiteSpace(message.Question))
            return;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            db.RagChatLogs.Add(new RagChatLog
            {
                Question = message.Question.Trim(),
                Answer = message.Answer,
                MatchedKnowledgeItemId = message.MatchedKnowledgeItemId,
                SimilarityScore = message.SimilarityScore,
                SourceType = message.SourceType,
                SessionId = string.IsNullOrWhiteSpace(message.SessionId) ? null : message.SessionId.Trim(),
                GuestKey = message.IdentityUserId.HasValue
                    ? null
                    : (string.IsNullOrWhiteSpace(message.GuestKey) ? null : message.GuestKey.Trim()),
                IdentityUserId = message.IdentityUserId,
                PhoneNumber = string.IsNullOrWhiteSpace(message.PhoneNumber)
                    ? null
                    : message.PhoneNumber.Trim(),
                WasAnswered = message.WasAnswered,
                CreatedAt = message.CreatedAtUtc == default ? DateTime.UtcNow : message.CreatedAtUtc,
            });
            db.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist RagChatLog to database");
        }
    }
}

using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Messages;
using Healan.Domain.Portal.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;

namespace Healan.Infrastructure.Portal;

public sealed class RagChatLogConsumerService : BackgroundService
{
    private readonly IChannelProvider _channelProvider;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RagChatLogConsumerService> _logger;

    public RagChatLogConsumerService(
        IChannelProvider channelProvider,
        IServiceScopeFactory scopeFactory,
        ILogger<RagChatLogConsumerService> logger)
    {
        _channelProvider = channelProvider;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Factory.StartNew(() =>
        {
            try
            {
                _channelProvider.SubscribeMessage<RagChatLogMessage>((messageId, model) =>
                {
                    try
                    {
                        if (model is null || string.IsNullOrWhiteSpace(model.Question))
                        {
                            _logger.LogWarning("Invalid RagChatLogMessage trace={Trace}", messageId);
                            return false;
                        }

                        using var scope = _scopeFactory.CreateScope();
                        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
                        db.RagChatLogs.Add(new RagChatLog
                        {
                            Question = model.Question.Trim(),
                            Answer = model.Answer,
                            MatchedKnowledgeItemId = model.MatchedKnowledgeItemId,
                            SimilarityScore = model.SimilarityScore,
                            SourceType = model.SourceType,
                            SessionId = string.IsNullOrWhiteSpace(model.SessionId) ? null : model.SessionId.Trim(),
                            GuestKey = model.IdentityUserId.HasValue
                                ? null
                                : (string.IsNullOrWhiteSpace(model.GuestKey) ? null : model.GuestKey.Trim()),
                            IdentityUserId = model.IdentityUserId,
                            PhoneNumber = string.IsNullOrWhiteSpace(model.PhoneNumber)
                                ? null
                                : model.PhoneNumber.Trim(),
                            WasAnswered = model.WasAnswered,
                            CreatedAt = model.CreatedAtUtc == default ? DateTime.UtcNow : model.CreatedAtUtc,
                        });
                        db.SaveChangesAsync(CancellationToken.None).GetAwaiter().GetResult();
                        return true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "RagChatLog consumer failed trace={Trace}", messageId);
                        return false;
                    }
                }, (QueueNames.RagChatLog, nameof(RagChatLogMessage)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to subscribe RagChatLog queue");
            }
        }, TaskCreationOptions.LongRunning);
    }
}

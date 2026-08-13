using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using StackExchange.Redis;
using TSEAI.Shared.Application.Alerts;

namespace TSEAI.Notification.Api.Alerts;

public sealed class RabbitMqAlertConsumer(
    IOptions<NotificationRabbitOptions> options,
    IConnectionMultiplexer redis,
    IHubContext<AlertHub> hub,
    ILogger<RabbitMqAlertConsumer> log) : BackgroundService
{
    private readonly NotificationRabbitOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            IConnection? connection = null;
            IChannel? channel = null;
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _options.Host,
                    Port = _options.Port,
                    UserName = _options.UserName,
                    Password = _options.Password,
                    VirtualHost = _options.VirtualHost,
                    AutomaticRecoveryEnabled = true,
                    TopologyRecoveryEnabled = true,
                    ClientProvidedName = "tseai-notification-alert-consumer"
                };
                connection = await factory.CreateConnectionAsync(stoppingToken);
                channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);
                await channel.ExchangeDeclareAsync(_options.Exchange, ExchangeType.Topic, durable: true, autoDelete: false, cancellationToken: stoppingToken);
                await channel.QueueDeclareAsync(_options.Queue, durable: true, exclusive: false, autoDelete: false, arguments: null, cancellationToken: stoppingToken);
                await channel.QueueBindAsync(_options.Queue, _options.Exchange, _options.RoutingKey, cancellationToken: stoppingToken);
                await channel.BasicQosAsync(0, 50, global: false, cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.ReceivedAsync += async (_, ea) =>
                {
                    RedisKey dedupKey = default;
                    var ownsDedup = false;
                    try
                    {
                        var payload = ea.Body.ToArray();
                        var message = JsonSerializer.Deserialize<AlertTriggeredMessage>(payload);
                        if (message is null)
                        {
                            await channel.BasicAckAsync(ea.DeliveryTag, false, stoppingToken);
                            return;
                        }

                        var db = redis.GetDatabase();
                        dedupKey = $"tseai:notification:dedup:{message.EventId:N}";
                        ownsDedup = await db.StringSetAsync(dedupKey, "inflight", TimeSpan.FromMinutes(2), When.NotExists);
                        if (!ownsDedup)
                        {
                            await channel.BasicAckAsync(ea.DeliveryTag, false, stoppingToken);
                            return;
                        }

                        await hub.Clients.User(message.OwnerUserId).SendAsync("alertTriggered", message, stoppingToken);
                        await db.StringSetAsync(dedupKey, "delivered", TimeSpan.FromDays(7));
                        await channel.BasicAckAsync(ea.DeliveryTag, false, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        // The reservation must not survive a failed SignalR send; otherwise a RabbitMQ redelivery
                        // could be ACKed as a duplicate even though the user never received the notification.
                        if (ownsDedup)
                        {
                            try { await redis.GetDatabase().KeyDeleteAsync(dedupKey); }
                            catch (Exception cleanupEx) { log.LogWarning(cleanupEx, "Alert dedup reservation cleanup failed"); }
                        }
                        log.LogError(ex, "Alert notification delivery failed");
                        await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: true, cancellationToken: stoppingToken);
                    }
                };

                await channel.BasicConsumeAsync(_options.Queue, autoAck: false, consumer, stoppingToken);
                log.LogInformation("Alert notification consumer started");
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex)
            {
                log.LogError(ex, "RabbitMQ notification consumer disconnected");
                await Task.Delay(2000, stoppingToken);
            }
            finally
            {
                if (channel is not null) try { await channel.DisposeAsync(); } catch { }
                if (connection is not null) try { await connection.DisposeAsync(); } catch { }
            }
        }
    }
}

using System.Text;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace TSEAI.Alert.Worker;

public sealed class RabbitMqAlertPublisher(IOptions<RabbitMqOptions> options, ILogger<RabbitMqAlertPublisher> log) : IAsyncDisposable
{
    private readonly RabbitMqOptions _options = options.Value;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnection? _connection;
    private IChannel? _channel;

    public async Task PublishAsync(Guid eventId, string payloadJson, CancellationToken ct)
    {
        await _gate.WaitAsync(ct);
        try
        {
            await EnsureChannelAsync(ct);
            var props = new BasicProperties
            {
                ContentType = "application/json",
                ContentEncoding = "utf-8",
                DeliveryMode = DeliveryModes.Persistent,
                MessageId = eventId.ToString("N"),
                Type = "alert.triggered",
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            };
            var body = Encoding.UTF8.GetBytes(payloadJson);
            await _channel!.BasicPublishAsync(
                exchange: _options.Exchange,
                routingKey: _options.RoutingKey,
                mandatory: true,
                basicProperties: props,
                body: body,
                cancellationToken: ct);
        }
        catch
        {
            await ResetAsync();
            throw;
        }
        finally { _gate.Release(); }
    }

    private async Task EnsureChannelAsync(CancellationToken ct)
    {
        if (_connection?.IsOpen == true && _channel?.IsOpen == true) return;
        await ResetAsync();
        var factory = new ConnectionFactory
        {
            HostName = _options.Host,
            Port = _options.Port,
            UserName = _options.UserName,
            Password = _options.Password,
            VirtualHost = _options.VirtualHost,
            AutomaticRecoveryEnabled = true,
            TopologyRecoveryEnabled = true,
            ClientProvidedName = "tseai-alert-outbox-publisher"
        };
        _connection = await factory.CreateConnectionAsync(ct);
        _channel = await _connection.CreateChannelAsync(new CreateChannelOptions(
            publisherConfirmationsEnabled: true,
            publisherConfirmationTrackingEnabled: true), ct);
        await _channel.ExchangeDeclareAsync(_options.Exchange, ExchangeType.Topic, durable: true, autoDelete: false, cancellationToken: ct);
        log.LogInformation("RabbitMQ alert publisher connected to {Host}", _options.Host);
    }

    private async Task ResetAsync()
    {
        if (_channel is not null)
        {
            try { await _channel.DisposeAsync(); } catch { }
            _channel = null;
        }
        if (_connection is not null)
        {
            try { await _connection.DisposeAsync(); } catch { }
            _connection = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await _gate.WaitAsync();
        try { await ResetAsync(); }
        finally { _gate.Release(); _gate.Dispose(); }
    }
}

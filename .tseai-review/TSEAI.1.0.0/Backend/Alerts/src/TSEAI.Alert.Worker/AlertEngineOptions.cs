namespace TSEAI.Alert.Worker;

public sealed class AlertEngineOptions
{
    public string StreamKey { get; set; } = "tseai:market:changes:v1";
    public string ConsumerGroup { get; set; } = "tseai-alert-engine-v1";
    public string? ConsumerName { get; set; }
    public int StreamReadCount { get; set; } = 20;
    public int IdleDelayMilliseconds { get; set; } = 250;
    public int PendingClaimIdleMilliseconds { get; set; } = 30000;
    public int StateTtlSeconds { get; set; } = 172800;
    public int RuleRefreshSeconds { get; set; } = 5;
    public int OutboxPollMilliseconds { get; set; } = 500;
    public int OutboxBatchSize { get; set; } = 50;
    public int OutboxLeaseSeconds { get; set; } = 120;
}

namespace TSEAI.Domain.Alerts;

public sealed class AlertRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string OwnerUserId { get; set; }
    public Guid SavedFilterId { get; set; }
    public TSEAI.Domain.Filters.SavedFilter? SavedFilter { get; set; }
    public required string Name { get; set; }
    public bool IsEnabled { get; set; } = true;
    public int CooldownSeconds { get; set; } = 300;
    public bool FollowLatestVersion { get; set; } = true;
    public int? PinnedFilterVersion { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastTriggeredAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class AlertEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlertRuleId { get; set; }
    public AlertRule? AlertRule { get; set; }
    public required string OwnerUserId { get; set; }
    public Guid SavedFilterId { get; set; }
    public int FilterVersion { get; set; }
    public long InsCode { get; set; }
    public string? SymbolCode { get; set; }
    public required string Symbol { get; set; }
    public required string SymbolName { get; set; }
    public required string AlertName { get; set; }
    public required string FilterName { get; set; }
    public required string TsetmcCode { get; set; }
    public required string PersianExplanation { get; set; }
    public required string Message { get; set; }
    public decimal LastPrice { get; set; }
    public decimal ClosingPrice { get; set; }
    public long TradeVolume { get; set; }
    public decimal TradeValue { get; set; }
    public int TradingDate { get; set; }
    public DateTime TriggeredAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAtUtc { get; set; }
}

public sealed class AlertOutbox
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AlertEventId { get; set; }
    public required string EventType { get; set; }
    public required string PayloadJson { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAtUtc { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? LastAttemptAtUtc { get; set; }
    public string? LastError { get; set; }
}

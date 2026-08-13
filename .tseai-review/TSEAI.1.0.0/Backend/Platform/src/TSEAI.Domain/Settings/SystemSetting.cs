namespace TSEAI.Domain.Settings;
public sealed class SystemSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Key { get; set; }
    public required string Value { get; set; }
    public required string ValueType { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; } = "General";
    public bool IsEditable { get; set; } = true;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
public static class SettingKeys
{
    public const string AnonymousDailyQuestionLimit = "AI.AnonymousDailyQuestionLimit";
    public const string AuthenticatedDailyQuestionLimit = "AI.AuthenticatedDailyQuestionLimit";
    public const string MaxSavedFiltersPerUser = "Filters.MaxSavedFiltersPerUser";
    public const string MaxAlertsPerUser = "Alerts.MaxPerUser";
    public const string AlertDefaultCooldownSeconds = "Alerts.DefaultCooldownSeconds";
    public const string AlertMaxCooldownSeconds = "Alerts.MaxCooldownSeconds";
    public const string AlertRuleRefreshSeconds = "Alerts.RuleRefreshSeconds";
    public const string MarketIsEnabled = "Market.IsEnabled";
    public const string MarketStartTime = "Market.StartTime";
    public const string MarketEndTime = "Market.EndTime";
    public const string MarketPollingIntervalMs = "Market.PollingIntervalMs";
}

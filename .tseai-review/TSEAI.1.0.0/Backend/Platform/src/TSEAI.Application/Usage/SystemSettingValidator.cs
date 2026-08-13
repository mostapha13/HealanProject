namespace TSEAI.Application.Usage;
public static class SystemSettingValidator
{
    public static string? Validate(string key,string value,string valueType)
    {
        if(string.IsNullOrWhiteSpace(key))return "Setting key is required.";
        if(valueType.Equals("int",StringComparison.OrdinalIgnoreCase)&&!int.TryParse(value,out var i))return "Value must be an integer.";
        if(valueType.Equals("bool",StringComparison.OrdinalIgnoreCase)&&!bool.TryParse(value,out _))return "Value must be true or false.";
        if(valueType.Equals("time",StringComparison.OrdinalIgnoreCase)&&!TimeOnly.TryParse(value,out _))return "Value must be a valid time (HH:mm).";
        if(key is "AI.AnonymousDailyQuestionLimit" or "AI.AuthenticatedDailyQuestionLimit" && (!int.TryParse(value,out var limit)||limit<0||limit>100000))return "Daily question limit must be between 0 and 100000.";
        if(key=="Market.PollingIntervalMs"&&(!int.TryParse(value,out var poll)||poll<250||poll>60000))return "Polling interval must be between 250 and 60000 ms.";
        if(key=="Filters.MaxSavedFiltersPerUser"&&(!int.TryParse(value,out var saved)||saved<0||saved>10000))return "Saved-filter limit must be between 0 and 10000.";
        if(key=="Alerts.MaxPerUser"&&(!int.TryParse(value,out var alerts)||alerts<0||alerts>10000))return "Alert limit must be between 0 and 10000.";
        if(key=="Alerts.DefaultCooldownSeconds"&&(!int.TryParse(value,out var cooldown)||cooldown<0||cooldown>86400))return "Default alert cooldown must be between 0 and 86400 seconds.";
        if(key=="Alerts.MaxCooldownSeconds"&&(!int.TryParse(value,out var maxCooldown)||maxCooldown<0||maxCooldown>604800))return "Maximum alert cooldown must be between 0 and 604800 seconds.";
        if(key=="Alerts.RuleRefreshSeconds"&&(!int.TryParse(value,out var refresh)||refresh<1||refresh>300))return "Alert rule refresh must be between 1 and 300 seconds.";
        return null;
    }
}

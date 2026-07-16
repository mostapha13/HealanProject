using SMSProvider.Application.Configs;

namespace SMSProvider.Application.Interfaces;

public interface ISmsRuntimeSettings
{
    Task<SmsRuntimeSnapshot> GetAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(SmsRuntimeSnapshot snapshot, CancellationToken cancellationToken = default);
}

public sealed class SmsRuntimeSnapshot
{
    public string ApiKey { get; set; } = string.Empty;
    public int TemplateId { get; set; } = 640023;
    public long LineNumber { get; set; }
    public string VerifyParameterName { get; set; } = "Code";
    public bool PreferVerifyForOtp { get; set; } = true;
    public bool SendEnabled { get; set; } = true;
    public bool LogOnlyWhenUnconfigured { get; set; }

    public static SmsRuntimeSnapshot FromOptions(SmsIrOptions options) => new()
    {
        ApiKey = options.ApiKey ?? string.Empty,
        TemplateId = options.TemplateId > 0 ? options.TemplateId : 640023,
        LineNumber = options.LineNumber,
        VerifyParameterName = string.IsNullOrWhiteSpace(options.VerifyParameterName) ? "Code" : options.VerifyParameterName,
        PreferVerifyForOtp = options.PreferVerifyForOtp,
        SendEnabled = true,
        LogOnlyWhenUnconfigured = options.LogOnlyWhenUnconfigured,
    };
}

namespace TSEAI.Application.Usage;
public sealed record QuotaStatus(int Limit, int Used, int Remaining, DateOnly Date, bool IsAuthenticated);
public interface IQuestionQuotaService
{
    Task<QuotaStatus> GetStatusAsync(string subject, bool authenticated, CancellationToken ct);
    Task<bool> TryReserveAsync(string subject, bool authenticated, CancellationToken ct);
    Task ReleaseAsync(string subject, bool authenticated, CancellationToken ct);
}
public interface ISystemSettingService
{
    Task<int> GetIntAsync(string key, int fallback, CancellationToken ct);
    Task<IReadOnlyDictionary<string,string>> GetAllAsync(CancellationToken ct);
    Task SetAsync(string key, string value, string valueType, string? title, string? description, string category, CancellationToken ct);
}

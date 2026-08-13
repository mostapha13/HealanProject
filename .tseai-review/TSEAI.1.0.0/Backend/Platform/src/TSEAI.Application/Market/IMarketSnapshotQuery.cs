using TSEAI.Shared.Application.Market;
namespace TSEAI.Application.Market;
public interface IMarketSnapshotQuery
{
    Task<MarketSymbolSnapshot?> FindAsync(string symbolOrCode,CancellationToken ct);
    Task<IReadOnlyList<MarketSymbolSnapshot>> GetActiveAsync(int limit,CancellationToken ct);
}

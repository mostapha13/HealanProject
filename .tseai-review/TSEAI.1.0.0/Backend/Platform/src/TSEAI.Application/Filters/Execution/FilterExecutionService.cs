using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Parsing;
using TSEAI.Application.Filters.Validation;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Market;

namespace TSEAI.Application.Filters.Execution;

public sealed record FilterMatch(
    string SymbolCode,
    long InsCode,
    string Symbol,
    string SymbolName,
    decimal LastPrice,
    decimal ClosingPrice,
    long TradeVolume,
    decimal TradeValue);

public sealed record FilterExecutionOptions(
    int Page = 1,
    int PageSize = 100,
    string? SortBy = null,
    bool SortDescending = true);

public sealed record FilterExecutionResult(
    int Scanned,
    int Matched,
    int Page,
    int PageSize,
    int TotalPages,
    string? SortBy,
    bool SortDescending,
    IReadOnlyList<FilterMatch> Results,
    int QualityRejected = 0);

public sealed class FilterExecutionService(IMarketSnapshotQuery market, IDataQualityService dataQuality)
{
    private readonly TsetmcFilterParser _parser = new();
    private readonly FilterValidator _validator = new();
    private readonly FilterEvaluator _evaluator = new();

    public (FilterExpression Ast, FilterValidationResult Validation) Parse(string source)
    {
        var ast = _parser.Parse(source);
        return (ast, _validator.Validate(ast));
    }

    public Task<FilterExecutionResult> ExecuteAsync(string source, int maxResults, CancellationToken ct) =>
        ExecuteAsync(source, new FilterExecutionOptions(1, maxResults), ct);

    public async Task<FilterExecutionResult> ExecuteAsync(string source, FilterExecutionOptions options, CancellationToken ct)
    {
        var (ast, validation) = Parse(source);
        if (!validation.IsValid) throw new InvalidOperationException(string.Join("; ", validation.Errors));

        var universe = await market.GetActiveAsync(30000, ct);
        var matches = new List<FilterMatch>();
        var qualityRejected = 0;
        foreach (var symbol in universe)
        {
            var quality = dataQuality.EvaluateMarketSnapshot(symbol);
            if (!quality.CanUseForAnswer)
            {
                qualityRejected++;
                continue;
            }

            bool ok;
            try { ok = _evaluator.Evaluate(ast, symbol); }
            catch { ok = false; }
            if (!ok) continue;
            matches.Add(new(
                symbol.SymbolCode ?? "",
                symbol.InsCode,
                symbol.Symbol,
                symbol.SymbolName,
                symbol.LastPrice,
                symbol.ClosingPrice,
                symbol.TradeVolume,
                symbol.TradeValue));
        }

        var sorted = Sort(matches, options.SortBy, options.SortDescending);
        var pageSize = Math.Clamp(options.PageSize, 1, 500);
        var totalPages = Math.Max(1, (int)Math.Ceiling(matches.Count / (double)pageSize));
        var page = Math.Clamp(options.Page, 1, totalPages);
        var pageResults = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToArray();
        return new(universe.Count, matches.Count, page, pageSize, totalPages, NormalizeSort(options.SortBy), options.SortDescending, pageResults, qualityRejected);
    }

    private static IEnumerable<FilterMatch> Sort(IEnumerable<FilterMatch> input, string? sortBy, bool desc)
    {
        var key = NormalizeSort(sortBy);
        if (key is null) return input;
        return (key, desc) switch
        {
            ("tradeValue", true) => input.OrderByDescending(x => x.TradeValue),
            ("tradeValue", false) => input.OrderBy(x => x.TradeValue),
            ("tradeVolume", true) => input.OrderByDescending(x => x.TradeVolume),
            ("tradeVolume", false) => input.OrderBy(x => x.TradeVolume),
            ("lastPrice", true) => input.OrderByDescending(x => x.LastPrice),
            ("lastPrice", false) => input.OrderBy(x => x.LastPrice),
            ("closingPrice", true) => input.OrderByDescending(x => x.ClosingPrice),
            ("closingPrice", false) => input.OrderBy(x => x.ClosingPrice),
            ("symbol", true) => input.OrderByDescending(x => x.Symbol, StringComparer.Create(new System.Globalization.CultureInfo("fa-IR"), false)),
            ("symbol", false) => input.OrderBy(x => x.Symbol, StringComparer.Create(new System.Globalization.CultureInfo("fa-IR"), false)),
            _ => input
        };
    }

    private static string? NormalizeSort(string? sortBy)
    {
        if (string.IsNullOrWhiteSpace(sortBy)) return null;
        return sortBy.Trim().ToLowerInvariant() switch
        {
            "tradevalue" or "tval" => "tradeValue",
            "tradevolume" or "tvol" => "tradeVolume",
            "lastprice" or "pl" => "lastPrice",
            "closingprice" or "pc" => "closingPrice",
            "symbol" or "l18" => "symbol",
            _ => throw new InvalidOperationException("Unsupported sort field. Allowed: tradeValue, tradeVolume, lastPrice, closingPrice, symbol.")
        };
    }
}

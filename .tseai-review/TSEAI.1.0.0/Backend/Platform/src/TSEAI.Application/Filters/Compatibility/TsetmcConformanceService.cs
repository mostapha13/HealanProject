using TSEAI.Application.Filters.Execution;
using TSEAI.Application.Filters.Parsing;
using TSEAI.Application.Filters.Validation;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Filters.Compatibility;

public sealed record ConformanceCaseResult(string Source, bool Passed, string? Canonical, string? Error);
public sealed record ConformanceReport(int Total, int Passed, IReadOnlyList<ConformanceCaseResult> Cases);

public sealed class TsetmcConformanceService
{
    private readonly TsetmcFilterParser _parser = new();
    private readonly FilterValidator _validator = new();
    private readonly TsetmcFilterExporter _exporter = new();
    private readonly FilterEvaluator _evaluator = new();

    private static readonly string[] Cases =
    [
        "(tno)>20",
        "(tvol)>(bvol)",
        "(tval)>10000000",
        "(pf)>=(py)",
        "(pmin)==(pl)",
        "(pl)>=(pc)",
        "(plc)<=100",
        "(plp)<=1.5",
        "(pcc)<=100",
        "(pcp)<=1.5",
        "(l18).indexOf(\"x\")==0",
        "(l30).indexOf(\"x\")!=-1",
        "(l18)[(l18).length-1]==\"x\"",
        "(pl)==(tmax) && (qd1)>=200_000_000",
        "(ct).Buy_I_Volume >= 2 * (ct).Sell_I_Volume",
        "(ct).Buy_CountI>0 && (ct).Sell_CountI>0",
        "(pd1)==(tmax) && (qd1)*(pd1)>1000000000",
        "Math.abs((pl)-(pc))<100",
        "Math.max((pl),(pc))==(pl)",
        "(tno)%10==0",
        "!((pl)-(py)>100)",
        "((pl)+(pc))/2>(py)",
        "(pd2)>(pd3) || (qd1)>(qo1)",
        "(eps)>0 && (pe)>0",
        "(mv)>1000000000000",
        "(buyop)>0",
        "(predtran)>0"
    ];

    public ConformanceReport Run()
    {
        var snapshots = Fixtures();
        var results = new List<ConformanceCaseResult>();
        foreach (var source in Cases)
        {
            try
            {
                var originalAst = _parser.Parse(source);
                var validation = _validator.Validate(originalAst);
                if (!validation.IsValid)
                {
                    results.Add(new(source, false, null, string.Join(";", validation.Errors)));
                    continue;
                }

                var canonical = _exporter.Export(originalAst);
                var roundTripAst = _parser.Parse(canonical);
                var roundTripValidation = _validator.Validate(roundTripAst);
                var same = roundTripValidation.IsValid && snapshots.All(snapshot => Safe(originalAst, snapshot) == Safe(roundTripAst, snapshot));
                results.Add(new(source, same, canonical, same ? null : "Round-trip semantic mismatch"));
            }
            catch (Exception ex)
            {
                results.Add(new(source, false, null, ex.Message));
            }
        }

        return new(results.Count, results.Count(x => x.Passed), results);
    }

    private bool Safe(TSEAI.Application.Filters.Ast.FilterExpression expression, MarketSymbolSnapshot snapshot)
    {
        try { return _evaluator.Evaluate(expression, snapshot); }
        catch { return false; }
    }

    private static IReadOnlyList<MarketSymbolSnapshot> Fixtures() => Enumerable.Range(1, 12).Select(i => new MarketSymbolSnapshot
    {
        InsCode = i,
        TradingDate = 20260809,
        Symbol = i % 2 == 0 ? "internal-x" : "internal",
        SymbolName = "Internal Company",
        TsetmcSymbol = i % 2 == 0 ? "xنماد" : "نمادx",
        TsetmcName = i % 3 == 0 ? "شرکت x" : "شرکت",
        TradeCount = i * 10,
        TradeVolume = i * 1_000_000,
        TradeValue = i * 2_000_000_000m,
        YesterdayPrice = 1000 + i * 10,
        FirstPrice = 980 + i * 20,
        LastPrice = 1000 + i * 30,
        ClosingPrice = 995 + i * 25,
        MinPrice = 950,
        MaxPrice = 1400,
        MinAllowedPrice = 800,
        MaxAllowedPrice = 1400,
        BaseVolume = 2_000_000,
        Eps = 100,
        PE = 6,
        MarketValue = i * 1_000_000_000_000m,
        OpenPositions = i,
        NavCancellation = i * 1000,
        ClientType = new ClientTypeSnapshot
        {
            BuyCountI = 10,
            BuyIVolume = i * 2_000_000,
            SellCountI = 20,
            SellIVolume = i * 700_000
        },
        OrderBook = Enumerable.Range(1, 5).Select(level => new OrderBookLevel
        {
            Level = level,
            BuyPrice = 1400 - level + 1,
            BuyVolume = i * 100_000_000 / level,
            SellPrice = 1400 + level,
            SellVolume = i * 50_000_000 / level
        }).ToArray()
    }).ToArray();
}

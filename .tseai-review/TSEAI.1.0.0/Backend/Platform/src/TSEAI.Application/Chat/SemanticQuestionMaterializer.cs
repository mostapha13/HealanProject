namespace TSEAI.Application.Chat;

/// <summary>
/// Projects a validated semantic frame onto the stable Persian grammar of the
/// typed SQL tools. The LLM understands the user's wording; this class owns the
/// deterministic tool boundary and therefore never generates SQL or facts.
/// </summary>
public static class SemanticQuestionMaterializer
{
    public static string Materialize(SemanticQuestionFrame frame)
    {
        var hall=Entity(frame,"regional_hall");
        var symbol=Entity(frame,"symbol")??Entity(frame,"index")??Entity(frame,"company");
        var namesOnly=frame.ResponseShape==SemanticResponseShape.NamesOnly?" فقط نام‌ها را بگو.":string.Empty;

        return (frame.Domain,frame.Operation) switch
        {
            (SemanticQuestionDomain.FinancialInstitution,SemanticQuestionOperation.Count)
                when hall is not null => $"تعداد نهادهای مالی تالار {hall} چقدر است؟",
            (SemanticQuestionDomain.FinancialInstitution,SemanticQuestionOperation.List)
                when hall is not null => $"فهرست نهادهای مالی تالار {hall} را بگو.{namesOnly}",
            (SemanticQuestionDomain.Company,SemanticQuestionOperation.Count)
                when hall is not null => $"تعداد شرکت‌های منتسب به تالار {hall} چقدر است؟",
            (SemanticQuestionDomain.Company,SemanticQuestionOperation.List)
                when hall is not null => $"فهرست شرکت‌های منتسب به تالار {hall} را بگو.{namesOnly}",
            (SemanticQuestionDomain.Company,SemanticQuestionOperation.Latest)
                when frame.Metrics.Contains("ipo_date",StringComparer.OrdinalIgnoreCase)
                  ||frame.Metrics.Contains("company_title",StringComparer.OrdinalIgnoreCase)
                    => $"آخرین عرضه اولیه ثبت‌شده در بورس تهران کدام شرکت است؟{namesOnly}",
            (SemanticQuestionDomain.Content,SemanticQuestionOperation.Latest)
                => "آخرین خبر بورس تهران چیست؟",
            (SemanticQuestionDomain.Market,SemanticQuestionOperation.Lookup)
                when symbol is not null => MarketQuestion(frame,symbol),
            (SemanticQuestionDomain.OrderBook,SemanticQuestionOperation.Lookup)
                when symbol is not null => $"دفتر سفارش و بهترین عرضه و تقاضای نماد {symbol} را بگو.",
            (SemanticQuestionDomain.ClientType,SemanticQuestionOperation.Lookup)
                when symbol is not null => $"آمار حقیقی و حقوقی نماد {symbol} را بگو.",
            (SemanticQuestionDomain.Organization,SemanticQuestionOperation.Lookup)
                when frame.Metrics.Contains("person_name",StringComparer.OrdinalIgnoreCase)
                    => $"{TrimQuestion(frame.CanonicalQuestion)}؛ این مسئول در ساختار بورس تهران چه کسی است؟",
            _ => frame.CanonicalQuestion
        };
    }

    private static string MarketQuestion(SemanticQuestionFrame frame,string symbol)
    {
        var metric=frame.Metrics.FirstOrDefault()?.ToLowerInvariant();
        var label=metric switch
        {
            "trade_volume"=>"حجم معاملات",
            "trade_value"=>"ارزش معاملات",
            "trade_count"=>"تعداد معاملات",
            "market_value"=>"ارزش بازار",
            "closing_price"=>"قیمت پایانی",
            "last_price" or "price"=>"آخرین قیمت",
            "pe"=>"نسبت P/E",
            "eps"=>"EPS",
            "observed_at"=>"تاریخ آخرین داده",
            _=>null
        };
        return label is null?frame.CanonicalQuestion:$"{label} نماد {symbol} چقدر است؟";
    }

    private static string? Entity(SemanticQuestionFrame frame,string kind)
        => frame.Entities.FirstOrDefault(x=>string.Equals(x.Kind,kind,StringComparison.OrdinalIgnoreCase))?.Value;

    private static string TrimQuestion(string value)=>value.Trim().TrimEnd('؟','?','.','؛');
}

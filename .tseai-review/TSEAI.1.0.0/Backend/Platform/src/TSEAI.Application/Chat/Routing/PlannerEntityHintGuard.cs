using System.Text.RegularExpressions;
using TSEAI.Application.Entities;

namespace TSEAI.Application.Chat.Routing;

/// <summary>
/// Rejects planner-produced "symbols" that are only concepts from the user's
/// sentence (for example «اولیه» in «عرضه اولیه بورس»). This is deliberately
/// applied only to AI planner hints; deterministic market extraction and the
/// authoritative entity resolver keep control of real tickers and identifiers.
/// </summary>
public static class PlannerEntityHintGuard
{
    private static readonly HashSet<string> ConceptTokens = new(StringComparer.Ordinal)
    {
        "اولیه", "عرضه", "خبر", "اخبار", "اطلاعیه", "گزارش", "مجمع", "قانون", "دستورالعمل",
        "بورس", "بازار", "فرابورس", "شرکت", "سازمان", "مدیر", "مدیرعامل", "معاون", "هیئت", "مدیره",
        "عضو", "اعضا", "رییس", "رئیس", "تاریخچه", "سابقه", "سوابق", "عملکرد", "وضعیت", "اطلاعات"
    };

    private static readonly string[] ExplicitEntityCues =
    [
        "نماد", "سهم", "تیکر", "instrumentid", "inscode", "کد نماد", "شناسه ابزار"
    ];

    public static bool IsUnsafe(string question, ChatPlan plan)
    {
        if (plan.Intent is not (ChatIntent.MarketSymbol or ChatIntent.MarketComparison or ChatIntent.Hybrid))
            return false;
        if (string.IsNullOrWhiteSpace(plan.Symbol)) return true;

        var hint = PersianEntityNormalizer.Normalize(plan.Symbol);
        if (hint.Length < 2) return true;
        if (long.TryParse(PersianEntityNormalizer.Compact(hint), out _)) return false;

        var tokens = hint.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (tokens.Length == 0 || !tokens.All(ConceptTokens.Contains)) return false;

        var normalizedQuestion = PersianEntityNormalizer.Normalize(question);
        var hasExplicitCue = ExplicitEntityCues.Any(cue =>
            Regex.IsMatch(normalizedQuestion, $@"(?:^|\s){Regex.Escape(cue)}\s+(?:[\p{{L}}\p{{Nd}}]+\s+){{0,2}}{Regex.Escape(hint)}(?:\s|$)"));
        if (hasExplicitCue) return false;

        // A detected numeric market facet is sufficient context for a ticker
        // such as «بورس»; otherwise a generic organizational/content concept
        // must not silently become an instrument.
        return PersianMarketQuestionSemantics.DetectRequestedFields(question).Count == 0;
    }
}

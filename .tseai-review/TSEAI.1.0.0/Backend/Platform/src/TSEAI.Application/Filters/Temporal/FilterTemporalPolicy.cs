using System.Text;
using System.Text.RegularExpressions;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Filters.Temporal;

public enum FilterTemporalExecutionMode
{
    CurrentSnapshot = 0,
    CurrentWeekendClosed = 1,
    HistoricalUnavailable = 2,
    HistoricalWeekendClosed = 3,
    FutureUnavailable = 4,
    FutureWeekendClosed = 5,
    InvalidTemporal = 6
}

public sealed record FilterTemporalDecision(
    bool CanExecute,
    FilterTemporalExecutionMode Mode,
    string Scope,
    string? StartJalali,
    string? EndJalali,
    string? StartGregorian,
    string? EndGregorian,
    string Message);

public interface IFilterTemporalPolicy
{
    FilterTemporalDecision Evaluate(TemporalResolution temporal);
    string RemoveTemporalExpression(string text, TemporalResolution temporal);
}

public sealed partial class DeterministicFilterTemporalPolicy : IFilterTemporalPolicy
{
    private static readonly Dictionary<char,char> DigitMap = new()
    {
        ['۰']='0',['۱']='1',['۲']='2',['۳']='3',['۴']='4',['۵']='5',['۶']='6',['۷']='7',['۸']='8',['۹']='9',
        ['٠']='0',['١']='1',['٢']='2',['٣']='3',['٤']='4',['٥']='5',['٦']='6',['٧']='7',['٨']='8',['٩']='9'
    };

    public FilterTemporalDecision Evaluate(TemporalResolution temporal)
    {
        if (temporal.Status is TemporalResolutionStatus.Invalid or TemporalResolutionStatus.Ambiguous)
            return Decision(false, FilterTemporalExecutionMode.InvalidTemporal, temporal,
                temporal.Error ?? "عبارت زمانی فیلتر معتبر نیست.");

        if (!temporal.HasTemporalReference)
            return Decision(true, FilterTemporalExecutionMode.CurrentSnapshot, temporal,
                "هیچ تاریخ صریحی تعیین نشده است؛ فیلتر روی Snapshot جاری بازار اجرا می‌شود.");

        if (temporal.IsReferenceDayOnly)
        {
            if (temporal.Start!.MarketDayKind == MarketDayKind.WeekendClosed)
                return Decision(false, FilterTemporalExecutionMode.CurrentWeekendClosed, temporal,
                    $"امروز {temporal.Start.JalaliDate} تعطیلی هفتگی بازار است؛ Snapshot معاملاتی به‌عنوان داده زنده امروز اجرا نمی‌شود.");
            return Decision(true, FilterTemporalExecutionMode.CurrentSnapshot, temporal,
                $"فیلتر برای امروز {temporal.Start!.JalaliDate} روی Snapshot جاری اجرا می‌شود.");
        }

        if (temporal.IsFuture)
        {
            var weekend = temporal.Start?.MarketDayKind == MarketDayKind.FutureWeekendClosed || temporal.End?.MarketDayKind == MarketDayKind.FutureWeekendClosed;
            return Decision(false, weekend ? FilterTemporalExecutionMode.FutureWeekendClosed : FilterTemporalExecutionMode.FutureUnavailable, temporal,
                weekend
                    ? "بازه/تاریخ در آینده شامل تعطیلی هفتگی بازار است و TSEAI داده آینده تولید نمی‌کند."
                    : "تاریخ یا بازه درخواست‌شده در آینده است و TSEAI داده بازار آینده را به‌عنوان واقعیت تولید نمی‌کند.");
        }

        var historicalWeekend = temporal.Start?.MarketDayKind == MarketDayKind.WeekendClosed && !temporal.IsRange;
        return Decision(false,
            historicalWeekend ? FilterTemporalExecutionMode.HistoricalWeekendClosed : FilterTemporalExecutionMode.HistoricalUnavailable,
            temporal,
            historicalWeekend
                ? $"تاریخ {temporal.Start!.JalaliDate} تعطیلی هفتگی بازار بوده است؛ Snapshot امروز جایگزین آن نمی‌شود."
                : $"محدوده تاریخی {temporal.Start!.JalaliDate} تا {temporal.End?.JalaliDate ?? temporal.Start.JalaliDate} شناسایی شد، اما MarketDailyHistory هنوز متصل نیست؛ اجرای فیلتر برای جلوگیری از نتیجه ساختگی متوقف شد.");
    }

    public string RemoveTemporalExpression(string text, TemporalResolution temporal)
    {
        var normalized = Normalize(text);
        if (!temporal.HasTemporalReference || string.IsNullOrWhiteSpace(temporal.MatchedText)) return normalized;
        var matched = Normalize(temporal.MatchedText);
        if (matched.Length == 0) return normalized;
        return MultiWhitespace().Replace(normalized.Replace(matched, " ", StringComparison.Ordinal), " ").Trim(' ', ',', '،', '.', '-', ':');
    }

    private static FilterTemporalDecision Decision(bool canExecute, FilterTemporalExecutionMode mode, TemporalResolution temporal, string message)
    {
        var start = temporal.Start;
        var end = temporal.End;
        var scope = !temporal.HasTemporalReference ? "current" : temporal.IsRange ? "range" : "date";
        return new(canExecute, mode, scope, start?.JalaliDate, end?.JalaliDate, start?.GregorianIso, end?.GregorianIso, message);
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var b = new StringBuilder(value.Length);
        foreach (var ch in value.Trim())
        {
            if (DigitMap.TryGetValue(ch, out var d)) { b.Append(d); continue; }
            b.Append(ch switch { 'ي'=>'ی','ى'=>'ی','ك'=>'ک','\u200c'=>' ','\u200f'=>' ','\u200e'=>' ','\u00a0'=>' ', _=>ch });
        }
        return MultiWhitespace().Replace(b.ToString(), " ").Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiWhitespace();
}

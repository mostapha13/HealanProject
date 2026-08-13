using System.Globalization;
using System.Text.RegularExpressions;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat.Context;

public sealed record ConversationTemporalTurn(
    TemporalResolution Primary,
    TemporalResolution? Comparison,
    bool ContextApplied,
    string ReferenceSource,
    IReadOnlyList<string> Reasons)
{
    public bool IsComparison => Comparison?.HasTemporalReference == true;
    public string AuditSummary => $"context={ContextApplied};source={ReferenceSource};primary={Primary.Start?.GregorianIso};comparison={Comparison?.Start?.GregorianIso};reasons={string.Join(',',Reasons)}";
}

public interface IConversationTemporalContextResolver
{
    Task<ConversationTemporalTurn> ResolveAsync(string subject,string conversationId,string question,CancellationToken ct);
}

public sealed partial class ConversationTemporalContextResolver(
    IConversationContextStore store,
    IPersianTemporalResolver resolver) : IConversationTemporalContextResolver
{
    private static readonly string[] SameDayCues = ["همون روز","همان روز","اون روز","آن روز","همون تاریخ","همان تاریخ","همون موقع","همان موقع"];
    private static readonly string[] SameRangeCues = ["همون بازه","همان بازه","همون دوره","همان دوره"];

    public async Task<ConversationTemporalTurn> ResolveAsync(string subject,string conversationId,string question,CancellationToken ct)
    {
        var state=await store.GetAsync(subject,conversationId,ct);
        var normalized=PersianTemporalNormalizer.Normalize(question);
        var reasons=new List<string>();

        if(TryResolveComparison(normalized,out var left,out var right))
        {
            var l=resolver.Resolve(left);
            var r=resolver.Resolve(right);
            if(l.HasTemporalReference && r.HasTemporalReference)
                return new(l,r,false,"explicit-comparison",["explicit-temporal-comparison"]);
        }

        var hasContextCue=HasContextualCue(normalized);
        if(!hasContextCue)
            return new(resolver.Resolve(question),null,false,"clock",[]);

        if(state.LastTemporal is null)
        {
            var fallback=resolver.Resolve(question);
            if(fallback.HasTemporalReference && !RequiresPriorAnchor(normalized))
                return new(fallback,null,false,"clock",[]);
            return new(ContextMissing(question),null,false,"missing-context",["temporal-context-anchor-missing"]);
        }

        if(SameRangeCues.Any(x=>normalized.Contains(x,StringComparison.Ordinal)) &&
           TryFromStoredRange(question,state.LastTemporal,out var sameRange))
        {
            reasons.Add("reuse-previous-temporal-range");
            return new(sameRange,null,true,"conversation.last-temporal",reasons);
        }

        if(SameDayCues.Any(x=>normalized.Contains(x,StringComparison.Ordinal)) &&
           TryStoredDate(state.LastTemporal.StartGregorian,out var sameDate))
        {
            var resolved=RebaseToClock(resolver.Resolve(sameDate.ToString("yyyy-MM-dd",CultureInfo.InvariantCulture),ReferenceUtc(sameDate)),question);
            reasons.Add("reuse-previous-temporal-date");
            return new(resolved,null,true,"conversation.last-temporal",reasons);
        }

        var anchor=SelectAnchor(state.LastTemporal,normalized);
        if(anchor is null)
            return new(ContextMissing(question),null,false,"missing-context",["temporal-context-anchor-invalid"]);

        var contextual=NormalizeContextualPhrase(normalized);
        var result=RebaseToClock(resolver.Resolve(contextual,ReferenceUtc(anchor.Value)),question);
        if(result.HasTemporalReference)
        {
            reasons.Add(normalized.Contains("بعدش",StringComparison.Ordinal)?"relative-after-previous-temporal":"relative-before-or-around-previous-temporal");
            reasons.Add($"anchor={anchor.Value:yyyy-MM-dd}");
            return new(result,null,true,"conversation.last-temporal",reasons);
        }

        return new(result,null,true,"conversation.last-temporal",["contextual-temporal-not-resolved"]);
    }

    private static bool TryResolveComparison(string text,out string left,out string right)
    {
        left=right=string.Empty;
        if(!text.Contains("مقایسه",StringComparison.Ordinal) || !text.Contains(" با ",StringComparison.Ordinal)) return false;
        var idx=text.IndexOf(" با ",StringComparison.Ordinal);
        if(idx<=0) return false;
        left=text[..idx].Replace(" رو "," ",StringComparison.Ordinal).Replace(" را "," ",StringComparison.Ordinal).Trim();
        right=text[(idx+4)..].Replace("مقایسه کن","",StringComparison.Ordinal).Replace("مقایسه","",StringComparison.Ordinal).Trim();
        return left.Length>0 && right.Length>0;
    }

    private static bool HasContextualCue(string text)
        => SameDayCues.Any(x=>text.Contains(x,StringComparison.Ordinal))
           || SameRangeCues.Any(x=>text.Contains(x,StringComparison.Ordinal))
           || ContextRelativeRegex().IsMatch(text)
           || text.Contains("هفته بعدش",StringComparison.Ordinal)
           || text.Contains("هفته قبلش",StringComparison.Ordinal)
           || text.Contains("ماه بعدش",StringComparison.Ordinal)
           || text.Contains("ماه قبلش",StringComparison.Ordinal);

    private static bool RequiresPriorAnchor(string text)=>HasContextualCue(text);

    private static string NormalizeContextualPhrase(string text)
    {
        var contextualMatch = ContextRelativeRegex().Match(text);
        var requiresImplicitSingleDay = contextualMatch.Success && !contextualMatch.Groups["n"].Success;
        var s=text.Replace("قبلش","قبل",StringComparison.Ordinal)
                  .Replace("بعدش","بعد",StringComparison.Ordinal)
                  .Replace("پیشش","پیش",StringComparison.Ordinal);
        if (requiresImplicitSingleDay)
            s=Regex.Replace(s,@"(?<!\S)روز\s+(قبل|بعد|پیش)(?!\S)","1 روز $1");
        return s;
    }

    private static DateOnly? SelectAnchor(ConversationTemporalReference t,string text)
    {
        var raw=text.Contains("بعدش",StringComparison.Ordinal)?t.EndGregorian:t.StartGregorian;
        return TryStoredDate(raw,out var d)?d:null;
    }

    private static bool TryStoredDate(string? iso,out DateOnly date)
        => DateOnly.TryParseExact(iso,"yyyy-MM-dd",CultureInfo.InvariantCulture,DateTimeStyles.None,out date);

    private static DateTimeOffset ReferenceUtc(DateOnly date)
        => new(date.ToDateTime(new TimeOnly(8,0)),TimeSpan.Zero);

    private bool TryFromStoredRange(string original,ConversationTemporalReference t,out TemporalResolution result)
    {
        result=default!;
        if(!TryStoredDate(t.StartGregorian,out var start) || !TryStoredDate(t.EndGregorian,out var end)) return false;
        var startR=resolver.Resolve(start.ToString("yyyy-MM-dd",CultureInfo.InvariantCulture));
        var endR=resolver.Resolve(end.ToString("yyyy-MM-dd",CultureInfo.InvariantCulture));
        var now=resolver.Resolve("امروز");
        if(startR.Start is null || endR.Start is null) return false;
        result=new(TemporalResolutionStatus.Resolved,TemporalIntentKind.DateRange,original,PersianTemporalNormalizer.Normalize(original),original,
            "Asia/Tehran",now.ReferenceDate,startR.Start,endR.Start,null,1.0,"conversation.same_range",null);
        return true;
    }


    private TemporalResolution RebaseToClock(TemporalResolution contextual,string original)
    {
        if(!contextual.HasTemporalReference || contextual.Start is null) return contextual;
        var now=resolver.Resolve("امروز");
        var start=resolver.Resolve(contextual.Start.GregorianIso).Start;
        var end=contextual.End is null?start:resolver.Resolve(contextual.End.GregorianIso).Start;
        if(start is null || end is null) return contextual;
        return new(contextual.Status,contextual.Kind,original,PersianTemporalNormalizer.Normalize(original),contextual.MatchedText,
            contextual.TimeZoneId,now.ReferenceDate,start,end,contextual.RelativeDayOffset,contextual.Confidence,contextual.Rule,contextual.Error);
    }

    private static TemporalResolution ContextMissing(string original)
    {
        var now=DateOnly.FromDateTime(DateTime.UtcNow);
        var p=new CanonicalDatePoint(now,now.ToString("yyyy-MM-dd",CultureInfo.InvariantCulture),"",now.DayOfWeek,false,
            now.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday?MarketDayKind.WeekendClosed:MarketDayKind.TradingDayCandidate,false);
        return new(TemporalResolutionStatus.Ambiguous,TemporalIntentKind.RelativeDate,original,PersianTemporalNormalizer.Normalize(original),null,
            "Asia/Tehran",p,null,null,null,0,"context.anchor_missing","عبارت زمانی نسبی به تاریخ قبلی اشاره می‌کند، اما تاریخ مرجعی در مکالمه وجود ندارد.");
    }

    [GeneratedRegex(@"(?:(?<n>\d+|[آ-ی]+(?:\s+و\s+[آ-ی]+)?)\s*)?روز\s*(?:قبلش|بعدش|پیشش)")]
    private static partial Regex ContextRelativeRegex();
}

using System.Text.RegularExpressions;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat.Context;

public sealed class ConversationContextService(
    IConversationContextStore store,
    IPersianEntityResolver entities) : IConversationContextService
{
    private static readonly string[] ClearCues = ["موضوع جدید","مکالمه جدید","کانتکست رو پاک کن","کانتکست را پاک کن","زمینه رو پاک کن","زمینه را پاک کن"];
    private static readonly string[] ComparisonCues = ["مقایسه","مقایسه کن","مقایسه‌شون","مقایسه شون","در مقایسه با","نسبت به"];
    private static readonly string[] MarketFollowUps = ["حقیقی حقوقی","حقیقی‌حقوقی","اردربوک","اوردر بوک","سفارش خرید","سفارش فروش","قیمتش","حجمش","پایانیش","صف خریدش","صف فروشش","وضعیتش","تابلوش"];
    private static readonly string[] KnowledgeFollowUps = ["خبرش","اخبارش","اطلاعیه‌ش","اطلاعیه اش","اطلاعیه‌اش","گزارشش","آخرین خبرش","خبر جدیدش"];
    private static readonly string[] HybridFollowUps = ["چرا افت","چرا رشد","چرا منفی","چرا مثبت","دلیل افت","دلیل رشد","علتش"];
    private static readonly string[] ReferentialCues = ["همون","همان","اون","آن سهم","این سهم","این نماد","همین نماد","همین سهم"];

    public async Task<ConversationTurnContext> PrepareAsync(string subject,string conversationId,string question,TemporalResolution temporal,CancellationToken ct)
    {
        var state=await store.GetAsync(subject,conversationId,ct);
        var q=Normalize(question);
        if(ClearCues.Any(x=>q.Contains(x,StringComparison.Ordinal)))
        {
            await store.ClearAsync(subject,conversationId,ct);
            state=ConversationContextState.Empty(conversationId);
            return new(question,question,state,new(ConversationFollowUpKind.None,null,null,null,false,["context-cleared"]),null,null,false,false);
        }

        var primary=state.PrimaryEntity;
        ConversationEntityReference? secondary=null;
        var reasons=new List<string>();
        var isCorrection=LooksLikeCorrection(q);
        var isComparison=ComparisonCues.Any(x=>q.Contains(x,StringComparison.Ordinal));

        if(isCorrection)
        {
            var candidate=ExtractCorrectionEntity(q);
            var resolved=await ResolveReferenceAsync(candidate,ct);
            if(resolved is not null)
            {
                primary=resolved;
                reasons.Add("explicit-correction-entity");
                var effective=BuildCorrectionQuestion(state,resolved);
                return new(question,effective,state,
                    new(ConversationFollowUpKind.Correction,PreferredFromPrevious(state),resolved.BestLookup,null,true,reasons),
                    resolved,null,true,false);
            }
        }

        if(isComparison && primary is not null)
        {
            var candidate=ExtractComparisonEntity(q);
            secondary=await ResolveReferenceAsync(candidate,ct);
            if(secondary is not null && !SameEntity(primary,secondary))
            {
                reasons.Add("comparison-uses-conversation-primary");
                reasons.Add("comparison-secondary-resolved");
                var effective=$"{question} نماد {primary.BestLookup} با نماد {secondary.BestLookup} مقایسه کن";
                return new(question,effective,state,
                    new(ConversationFollowUpKind.Comparison,ChatIntent.MarketComparison,primary.BestLookup,secondary.BestLookup,true,reasons),
                    primary,secondary,false,true);
            }
        }

        if(primary is not null)
        {
            if(HybridFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal)))
            {
                reasons.Add("hybrid-followup-with-primary-entity");
                return Applied(question,state,primary,ConversationFollowUpKind.Hybrid,ChatIntent.Hybrid,reasons);
            }
            if(KnowledgeFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal)))
            {
                reasons.Add("knowledge-followup-with-primary-entity");
                return Applied(question,state,primary,ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,reasons);
            }
            if(MarketFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal)) || ReferentialCues.Any(x=>q.Contains(x,StringComparison.Ordinal)))
            {
                reasons.Add("market-followup-with-primary-entity");
                return Applied(question,state,primary,ConversationFollowUpKind.Market,ChatIntent.MarketSymbol,reasons);
            }
        }

        return new(question,question,state,new(ConversationFollowUpKind.None,null,primary?.BestLookup,null,false,[]),primary,null,false,false);
    }

    public async Task<ConversationContextState> RecordAsync(
        string subject,string conversationId,string question,ChatIntent intent,ChatCapabilityRoute route,
        TemporalResolution temporal,EntityResolution? primary,EntityResolution? secondary,CancellationToken ct)
    {
        var current=await store.GetAsync(subject,conversationId,ct);
        var p=Selected(primary)??current.PrimaryEntity;
        var s=Selected(secondary);
        // A new resolved primary entity starts a new comparison context unless the current turn explicitly supplied a secondary.
        if(Selected(primary) is not null && s is null) s=null;
        var temporalRef=temporal.HasTemporalReference
            ? new ConversationTemporalReference(temporal.OriginalText,temporal.Start?.JalaliDate,temporal.End?.JalaliDate,temporal.Start?.GregorianIso,temporal.End?.GregorianIso,temporal.Kind.ToString())
            : current.LastTemporal;
        var next=new ConversationContextState(conversationId,p,s,intent,route,temporalRef,question,current.Revision+1,DateTimeOffset.UtcNow);
        await store.SaveAsync(subject,next,ct);
        return next;
    }

    private static ConversationTurnContext Applied(string question,ConversationContextState state,ConversationEntityReference primary,ConversationFollowUpKind kind,ChatIntent intent,List<string> reasons)
        => new(question,$"{question} نماد {primary.BestLookup}",state,new(kind,intent,primary.BestLookup,null,true,reasons),primary,null,false,false);

    private async Task<ConversationEntityReference?> ResolveReferenceAsync(string? text,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(text)) return null;
        var r=await entities.ResolveAsync(text,new EntityResolveOptions([EntityKind.Instrument]),ct);
        return r.Status==EntityResolutionStatus.Resolved && r.Selected is not null ? ConversationEntityReference.From(r.Selected) : null;
    }

    private static ConversationEntityReference? Selected(EntityResolution? r)
        => r?.Status==EntityResolutionStatus.Resolved && r.Selected is not null ? ConversationEntityReference.From(r.Selected) : null;

    private static bool SameEntity(ConversationEntityReference a,ConversationEntityReference b)
        => string.Equals(a.CanonicalId,b.CanonicalId,StringComparison.OrdinalIgnoreCase);

    private static ChatIntent PreferredFromPrevious(ConversationContextState state)
        => state.LastIntent is ChatIntent.Knowledge ? ChatIntent.Knowledge : state.LastIntent is ChatIntent.Hybrid ? ChatIntent.Hybrid : ChatIntent.MarketSymbol;

    private static string BuildCorrectionQuestion(ConversationContextState state,ConversationEntityReference entity)
        => state.LastIntent switch
        {
            ChatIntent.Knowledge => $"آخرین اطلاعات و خبر نماد {entity.BestLookup}",
            ChatIntent.Hybrid => $"وضعیت بازار و اطلاعات مرتبط نماد {entity.BestLookup}",
            _ => $"وضعیت نماد {entity.BestLookup}"
        };

    private static bool LooksLikeCorrection(string q)
        => q.Contains("منظورم",StringComparison.Ordinal) || q.Contains("نه،",StringComparison.Ordinal) || q.StartsWith("نه ",StringComparison.Ordinal) || q.Contains("به جای",StringComparison.Ordinal);

    private static string? ExtractCorrectionEntity(string q)
    {
        var m=Regex.Match(q,@"(?:منظورم(?:\s+از\s+[^،,.!?]+)?|به\s+جای\s+[^،,.!?]+)\s+(?<e>[\p{L}\p{N}_\-‌ ]{2,80}?)(?:\s+(?:بود|هست|است|رو|را))?(?:$|[،,.!?])");
        if(m.Success) return CleanCandidate(m.Groups["e"].Value);
        if(q.StartsWith("نه ",StringComparison.Ordinal)) return CleanCandidate(q[3..]);
        return null;
    }

    private static string? ExtractComparisonEntity(string q)
    {
        var m=Regex.Match(q,@"\bبا\s+(?<e>[\p{L}\p{N}_\-‌ ]{2,80}?)\s+(?:مقایسه|مقایسه‌ش|مقایسه ش|بسنج|قیاس)");
        if(m.Success) return CleanCandidate(m.Groups["e"].Value);
        m=Regex.Match(q,@"(?:مقایسه\s+کن\s+با|نسبت\s+به)\s+(?<e>[\p{L}\p{N}_\-‌ ]{2,80})(?:$|[،,.!?])");
        return m.Success?CleanCandidate(m.Groups["e"].Value):null;
    }

    private static string CleanCandidate(string value)
    {
        var v=Normalize(value);
        foreach(var x in new[]{"نماد","سهم","شرکت","حالا","الان","رو","را"})
            v=Regex.Replace(v,$@"\b{Regex.Escape(x)}\b"," ");
        return Regex.Replace(v,@"\s+"," ").Trim();
    }

    private static string Normalize(string s)
        => Regex.Replace((s??string.Empty).Replace('ي','ی').Replace('ك','ک'),@"\s+"," ").Trim();
}

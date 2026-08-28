using System.Text.RegularExpressions;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat.Context;

public sealed class ConversationContextService(
    IConversationContextStore store,
    IPersianEntityResolver entities,
    IConversationQueryRewriter rewriter) : IConversationContextService
{
    private static readonly string[] ClearCues = ["موضوع جدید","مکالمه جدید","کانتکست رو پاک کن","کانتکست را پاک کن","زمینه رو پاک کن","زمینه را پاک کن"];
    private static readonly string[] ComplaintCues = ["خنگ","احمق","جواب بی ربط","جواب بی‌ربط","نامرتبط","اشتباه جواب","غلط جواب","درست جواب بده","دقیق جواب بده"];
    private static readonly string[] ComparisonCues = ["مقایسه","مقایسه کن","مقایسه‌شون","مقایسه شون","در مقایسه با","نسبت به"];
    private static readonly string[] MarketFollowUps = ["حقیقی حقوقی","حقیقی‌حقوقی","اردربوک","اوردر بوک","سفارش خرید","سفارش فروش","قیمتش","آخرین قیمتش","حجمش","حجم معاملاتش","ارزش معاملاتش","ارزش بازارش","پایانیش","قیمت پایانیش","صف خریدش","صف فروشش","وضعیتش","تابلوش"];
    private static readonly string[] KnowledgeFollowUps = ["خبرش","اخبارش","اطلاعیه‌ش","اطلاعیه اش","اطلاعیه‌اش","گزارشش","آخرین خبرش","خبر جدیدش"];
    private static readonly string[] CompanyReferenceFollowUps =
    [
        "نمادش", "نماد آن شرکت", "نماد این شرکت", "اسم نماد", "کد نماد",
        "سایتش", "وب سایتش", "وب‌سایتش", "تلفنش", "شماره تماسش", "مدیرعاملش", "مدیر عاملش",
        "تالارش", "استانش", "استان آن شرکت", "استان این شرکت", "کدام استان", "کدوم استان", "چه استانی",
        "در چه استان", "متعلق به کدام استان", "متعلق به کدوم استان", "مربوط به کدام استان", "مربوط به کدوم استان",
        "تاریخ عرضه اش", "تاریخ عرضه‌اش", "کی عرضه شده", "چه زمانی عرضه شده"
    ];
    private static readonly string[] HybridFollowUps = ["چرا افت","چرا رشد","چرا منفی","چرا مثبت","دلیل افت","دلیل رشد","علتش"];
    private static readonly string[] ReferentialCues = ["همون","همان","اون","آن سهم","این سهم","این نماد","همین نماد","همین سهم"];
    private static readonly string[] OrganizationFollowUps =
    [
        "نماینده کدام", "نماینده کدوم", "نماینده چه", "از طرف کدام", "از طرف کدوم", "از سوی کدام",
        "سابقه اش", "سابقه‌اش", "سوابقش", "رزومه اش", "رزومه‌اش", "تحصیلاتش", "درباره اش", "درباره‌اش",
        "کدام شرکت است", "کدوم شرکت هست", "چه شرکتی است", "سمتش چیست", "سمتش چیه",
        "زیر مجموعه", "زیرمجموعه", "واحدهای تابع", "مدیران تابع", "وابسته", "بالادست",
        "گزارش می دهد", "گزارش میدهد", "گزارش می ده", "گزارش میده", "مدیر مستقیم", "مسئول مستقیم", "معاونتش"
    ];
    private static readonly string[] OrganizationRosterFollowUps =
    [
        "فقط اسم", "فقط نام", "فقط اسامی", "اسم اعضا", "نام اعضا", "اسامی اعضا",
        "همه اعضا", "تمام اعضا", "کلیه اعضا", "اعضا را بگو", "اعضا رو بگو",
        "سمت اعضا", "سمت هاشون", "سمت‌هاشون", "سمتشون",
        "شرکتشون", "شرکت هاشون", "شرکت‌هاشون", "نماینده هاشون", "نماینده‌هاشون",
        "سابقه شون", "سابقه‌شون", "سوابقشون", "رزومه شون", "رزومه‌شون"
    ];
    private static readonly string[] OrganizationRosterFacetCues =
    [
        "اسم", "نام", "اسامی", "کیا", "چه کسانی", "چه افرادی",
        "سمت", "نقش", "مسئولیت", "نماینده", "نمایندگی", "شرکت",
        "سابقه", "سوابق", "رزومه", "پیشینه", "تحصیلات"
    ];
    private static readonly string[] PluralReferenceCues =
    [
        "شون", "شان", "آنها", "اونا", "ایشان", "اینها", "همشون",
        "هرکدام", "هر کدام", "هرکدوم", "هر کدوم", "تک تک", "اعضا", "مدیران", "افراد"
    ];
    private static readonly string[] CompanyHallFollowUps =
    [
        "اسم", "نام", "اسامی", "کیا", "چه شرکت", "کدام شرکت", "کدوم شرکت", "شرکتاش", "شرکت هاش",
        "فهرست", "لیست", "همه", "همشون", "چند", "چندتا", "چنتا", "تعداد", "شرکت ها", "شرکت‌های", "شرکت های", "شرکتای"
    ];
    private static readonly string[] FinancialHallFollowUps =
    [
        "اسم", "نام", "اسامی", "کیا", "نهادها", "نهاداش", "نهادهاش", "نهادای مالی",
        "کارگزاری ها", "کارگزاریهاش", "کارگزاری هاش", "کارگزاریاش",
        "سبدگردان ها", "سبدگرداناش", "سبدگردان هاش", "مشاوراش",
        "فهرست", "لیست", "همه", "همشون", "چند", "چندتا", "چنتا", "تعداد", "آدرس", "نشانی", "نشونی", "تلفن", "تماس"
    ];
    private static readonly string[] RegionalHallDetailFollowUps =
    [
        "آدرسش", "نشونیش", "نشانیش", "مکانش", "کجاست", "کجا قرار", "شماره تماسش", "تلفنش",
        "کدش", "چه کدی", "آخرین بروزرسانی", "آخرین به روزرسانی", "کی آپدیت", "چه زمانی جمع",
        "زیر مجموعه کجاست", "زیرمجموعه کجاست", "کدام معاونت", "کدوم معاونت", "بالادستش"
    ];

    public async Task<ConversationTurnContext> PrepareAsync(string subject,string conversationId,string question,TemporalResolution temporal,CancellationToken ct)
    {
        var state=await store.GetAsync(subject,conversationId,ct);
        var q=Normalize(question);
        var standaloneQuestion=LooksLikeStandaloneQuestion(q);
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

        var recent=state.RecentTurns??[];
        if(state.ActiveReference is { Kind: "hall", SubjectName.Length: > 0 } regionalHall
           &&!q.Contains("تالار",StringComparison.Ordinal)
           &&RegionalHallDetailFollowUps.Any(cue=>q.Contains(cue,StringComparison.Ordinal)))
        {
            var effective=BuildRegionalHallFollowUp(q,regionalHall.SubjectName);
            reasons.Add("regional-hall-detail-followup");
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { Kind: "hall_address_catalog" }
           &&(ContainsAny(q,"مکان فیزیکی","مکان های فیزیکی","مکان‌های فیزیکی","آدرس فیزیکی","نشانی فیزیکی")
              ||ComplaintCues.Any(cue=>q.Contains(cue,StringComparison.Ordinal))))
        {
            reasons.Add("regional-hall-address-catalog-followup");
            if(ComplaintCues.Any(cue=>q.Contains(cue,StringComparison.Ordinal)))
                reasons.Add("repair-request-retry-previous-question");
            return new(question,"آدرس فیزیکی کدام تالارهای منطقه‌ای در داده‌های فعلی موجود است؟",state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(ComplaintCues.Any(cue=>q.Contains(cue,StringComparison.Ordinal))&&recent.Count>0)
        {
            reasons.Add("repair-request-retry-previous-question");
            return new(question,recent[^1].EffectiveQuestion,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { SubjectName.Length: > 0 } companyHall
           &&companyHall.Kind is "company_hall" or "hall"
           &&!q.Contains("تالار",StringComparison.Ordinal)
           &&IsFinancialHallCrossDomainFollowUp(q))
        {
            var effective=BuildFinancialHallFollowUp(q,companyHall.SubjectName,CanonicalFinancialInstitutionQuestion.DetectType(q));
            reasons.Add("financial-hall-cross-domain-followup");
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { Kind: "financial_institution_hall", SubjectName.Length: > 0 } institutionHall
           &&!q.Contains("تالار",StringComparison.Ordinal)
           &&IsCompanyHallCrossDomainFollowUp(q))
        {
            var asksCount=ContainsAny(q,"چند","چندتا","چنتا","تعداد","شمارش");
            var effective=asksCount
                ? $"تعداد شرکت‌های منتسب به تالار {institutionHall.SubjectName} چقدر است؟"
                : $"فهرست شرکت‌های منتسب به تالار {institutionHall.SubjectName} را فقط نام‌ها بگو.";
            reasons.Add("company-hall-cross-domain-followup");
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { SubjectName.Length: > 0 } hallReference
           &&hallReference.Kind is "company_hall" or "hall"
           &&!q.Contains("تالار",StringComparison.Ordinal)
           &&IsCompanyHallFollowUp(hallReference,q,standaloneQuestion))
        {
            var asksCount=ContainsAny(q,"چند","چندتا","چنتا","تعداد","شمارش");
            var effective=asksCount
                ? $"تعداد شرکت‌های منتسب به تالار {hallReference.SubjectName} چقدر است؟"
                : $"فهرست شرکت‌های منتسب به تالار {hallReference.SubjectName} را فقط نام‌ها بگو.";
            reasons.Add("company-hall-followup-with-active-reference");
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { Kind: "financial_institution_hall", SubjectName.Length: > 0 } financialHall
           &&!q.Contains("تالار",StringComparison.Ordinal)
           &&IsFinancialHallFollowUp(q,standaloneQuestion))
        {
            var effective=BuildFinancialHallFollowUp(q,financialHall.SubjectName,financialHall.SubjectRole);
            reasons.Add("financial-hall-followup-with-active-reference");
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        var rosterFollowUp=state.ActiveReference is not null&&IsOrganizationRosterFollowUp(state.ActiveReference,q);
        if(state.ActiveReference is { Kind: var activeKind }
            &&activeKind.StartsWith("organization",StringComparison.Ordinal)
            && !LooksLikeExplicitMarketQuestion(q)
            && (OrganizationFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal))
                || rosterFollowUp))
        {
            var reference=state.ActiveReference;
            var referenceSubject=reference.SubjectName??reference.Topic;
            var role=string.IsNullOrWhiteSpace(reference.SubjectRole)?"":$" با سمت {reference.SubjectRole}";
            reasons.Add("organization-followup-with-active-reference");
            if(rosterFollowUp) reasons.Add("organization-roster-followup");
            var effective=rosterFollowUp
                ? BuildOrganizationRosterQuestion(question,reference)
                : $"{question} درباره {referenceSubject}{role} در بورس تهران";
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        if(state.ActiveReference is { SubjectName.Length: > 0 } companyReference
            &&companyReference.Kind.StartsWith("company",StringComparison.Ordinal)
            &&companyReference.Kind!="company_hall"
            &&CompanyReferenceFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal)))
        {
            reasons.Add("company-followup-with-active-reference");
            var effective=BuildCompanyReferenceQuestion(q,companyReference.SubjectName!);
            return new(question,effective,state,
                new(ConversationFollowUpKind.Knowledge,ChatIntent.Knowledge,null,null,true,reasons),null,null,false,false);
        }

        var isReferentialMarketFollowUp=MarketFollowUps.Any(x=>q.Contains(x,StringComparison.Ordinal))
            ||ReferentialCues.Any(x=>ContainsWholeCue(q,x));
        if(primary is not null&&(!standaloneQuestion||isReferentialMarketFollowUp))
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
            if(isReferentialMarketFollowUp)
            {
                reasons.Add("market-followup-with-primary-entity");
                return Applied(question,state,primary,ConversationFollowUpKind.Market,ChatIntent.MarketSymbol,reasons);
            }
        }

        if(recent.Count>0&&RequiresSemanticRewrite(q)&&!standaloneQuestion)
        {
            var rewritten=await rewriter.RewriteAsync(new(question,state.ActiveReference,recent.TakeLast(12).ToArray()),ct);
            if(rewritten?.ContextApplied==true && IsSafeRewrite(question,rewritten.StandaloneQuestion))
            {
                reasons.Add("semantic-conversation-rewrite");
                if(!string.IsNullOrWhiteSpace(rewritten.Reason)) reasons.Add(rewritten.Reason!);
                var preferred=state.ActiveReference?.Kind.StartsWith("organization",StringComparison.Ordinal)==true
                    ? ChatIntent.Knowledge
                    : PreferredFromPrevious(state);
                var rewrittenPrimary=preferred==ChatIntent.Knowledge && state.ActiveReference?.Kind.StartsWith("organization",StringComparison.Ordinal)==true
                    ? null
                    : primary;
                var kind=preferred==ChatIntent.Hybrid?ConversationFollowUpKind.Hybrid:
                    preferred==ChatIntent.Knowledge?ConversationFollowUpKind.Knowledge:ConversationFollowUpKind.Market;
                return new(question,rewritten.StandaloneQuestion,state,
                    new(kind,preferred,rewrittenPrimary?.BestLookup,null,true,reasons),rewrittenPrimary,null,false,false);
            }
        }

        return new(question,question,state,new(ConversationFollowUpKind.None,null,null,null,false,[]),null,null,false,false);
    }

    public async Task<ConversationContextState> RecordAsync(
        string subject,string conversationId,string question,ChatIntent intent,ChatCapabilityRoute route,
        TemporalResolution temporal,EntityResolution? primary,EntityResolution? secondary,CancellationToken ct,
        string? answer=null,string answerType="chat")
    {
        var current=await store.GetAsync(subject,conversationId,ct);
        var selectedPrimary=Selected(primary);
        var p=selectedPrimary??current.PrimaryEntity;
        var s=Selected(secondary);
        // A new resolved primary entity starts a new comparison context unless the current turn explicitly supplied a secondary.
        if(Selected(primary) is not null && s is null) s=null;
        var temporalRef=temporal.HasTemporalReference
            ? new ConversationTemporalReference(temporal.OriginalText,temporal.Start?.JalaliDate,temporal.End?.JalaliDate,temporal.Start?.GregorianIso,temporal.End?.GregorianIso,temporal.Kind.ToString())
            : current.LastTemporal;
        var turns=AppendTurn(current.RecentTurns,question,question,answer,answerType,current.ActiveReference?.SubjectName);
        var activeReference=selectedPrimary is null?current.ActiveReference:null;
        var next=new ConversationContextState(conversationId,p,s,intent,route,temporalRef,question,current.Revision+1,DateTimeOffset.UtcNow,activeReference,turns);
        await store.SaveAsync(subject,next,ct);
        return next;
    }

    public async Task<ConversationContextState> RecordReferenceAsync(
        string subject,string conversationId,string originalQuestion,string effectiveQuestion,string answer,
        CanonicalReferenceAnswer reference,TemporalResolution temporal,CancellationToken ct)
    {
        var current=await store.GetAsync(subject,conversationId,ct);
        var temporalRef=temporal.HasTemporalReference
            ? new ConversationTemporalReference(temporal.OriginalText,temporal.Start?.JalaliDate,temporal.End?.JalaliDate,temporal.Start?.GregorianIso,temporal.End?.GregorianIso,temporal.Kind.ToString())
            : current.LastTemporal;
        var active=new ConversationReference(reference.Reference.Kind,reference.Reference.Topic,reference.Reference.SubjectName,
            reference.Reference.SubjectRole,reference.Reference.RelatedSubjects);
        var turns=AppendTurn(current.RecentTurns,originalQuestion,effectiveQuestion,answer,"structured_reference",active.SubjectName??active.Topic);
        var clearsMarketContext=reference.Reference.Kind.StartsWith("organization",StringComparison.Ordinal)
            ||reference.Reference.Kind is "company_hall" or "financial_institution_hall" or "hall" or "hall_address_catalog";
        var next=new ConversationContextState(conversationId,clearsMarketContext?null:current.PrimaryEntity,clearsMarketContext?null:current.SecondaryEntity,ChatIntent.Knowledge,
            ChatCapabilityRoute.Knowledge,temporalRef,originalQuestion,current.Revision+1,DateTimeOffset.UtcNow,active,turns);
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

    private static string BuildCompanyReferenceQuestion(string normalized,string subject)
    {
        if(normalized.Contains("نماد",StringComparison.Ordinal)) return $"نماد شرکت {subject} چیست؟";
        if(normalized.Contains("سایت",StringComparison.Ordinal)) return $"وب‌سایت شرکت {subject} چیست؟";
        if(normalized.Contains("تلفن",StringComparison.Ordinal)||normalized.Contains("تماس",StringComparison.Ordinal)) return $"شماره تماس شرکت {subject} چیست؟";
        if(normalized.Contains("مدیرعامل",StringComparison.Ordinal)||normalized.Contains("مدیر عامل",StringComparison.Ordinal)) return $"مدیرعامل شرکت {subject} کیست؟";
        if(normalized.Contains("استان",StringComparison.Ordinal)) return $"تالار منطقه‌ای شرکت {subject} در کدام استان ثبت شده است؟";
        if(normalized.Contains("تالار",StringComparison.Ordinal)) return $"شرکت {subject} در کدام تالار است؟";
        return $"تاریخ عرضه اولیه شرکت {subject} چیست؟";
    }

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

    private static IReadOnlyList<ConversationMemoryTurn> AppendTurn(
        IReadOnlyList<ConversationMemoryTurn>? existing,string question,string effectiveQuestion,string? answer,string answerType,string? subjectName)
    {
        var turns=(existing??[]).TakeLast(49).ToList();
        if(!string.IsNullOrWhiteSpace(answer))
            turns.Add(new(question,effectiveQuestion,answer.Length<=2000?answer:answer[..2000]+"…",answerType,subjectName,DateTimeOffset.UtcNow));
        return turns;
    }

    private static bool IsSafeRewrite(string original,string rewritten)
    {
        if(string.IsNullOrWhiteSpace(rewritten) || rewritten.Length>4000) return false;
        var originalTerms=Normalize(original).Split(' ',StringSplitOptions.RemoveEmptyEntries)
            .Where(x=>x.Length>1).ToHashSet(StringComparer.Ordinal);
        var rewrittenTerms=Normalize(rewritten).Split(' ',StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.Ordinal);
        return originalTerms.Count==0 || originalTerms.Count(x=>rewrittenTerms.Contains(x))>=Math.Min(2,originalTerms.Count);
    }

    private static bool LooksLikeExplicitMarketQuestion(string normalized)
        => normalized.Contains("نماد",StringComparison.Ordinal)
            || normalized.Contains("سهم",StringComparison.Ordinal)
            || normalized.Contains("قیمت",StringComparison.Ordinal)
            || normalized.Contains("حجم معاملات",StringComparison.Ordinal)
            || normalized.Contains("ارزش معاملات",StringComparison.Ordinal)
            || normalized.Contains("اردربوک",StringComparison.Ordinal)
            || normalized.Contains("سفارش خرید",StringComparison.Ordinal)
            || normalized.Contains("سفارش فروش",StringComparison.Ordinal);

    private static bool LooksLikeStandaloneQuestion(string normalized)
        => LooksLikeExplicitMarketQuestion(normalized)
            ||CanonicalCompanyQuestion.Parse(normalized).IsMatch
            ||CanonicalCompanyStateQuestion.Parse(normalized).IsMatch
            ||CanonicalClientTypeQuestion.Parse(normalized).IsMatch
            ||CanonicalContentQuestion.Parse(normalized).IsMatch
            ||CanonicalFinancialInstitutionQuestion.Parse(normalized).IsMatch
            ||CanonicalBoardMemberAnswer.Parse(normalized).IsMemberList
            ||PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity(normalized) is not null
            ||PersianQuestionFacetAnalysis.TryExtractDescriptiveEntity(normalized) is not null
            ||PersianQuestionFacetAnalysis.TryExtractMarketComparisonEntities(normalized) is not null
            ||normalized.Contains("آخرین خبر بورس تهران",StringComparison.Ordinal)
            ||normalized.Contains("امروز",StringComparison.Ordinal)
            ||normalized.Contains("فردا",StringComparison.Ordinal)
            ||normalized.Contains("دیروز",StringComparison.Ordinal);

    private static bool RequiresSemanticRewrite(string normalized)
    {
        if(normalized.Length>240) return false;
        if(Regex.IsMatch(normalized,@"^(?:حالا|پس|خب|خوب|و|اما|بعد|بعدش)\s+")) return true;
        if(Regex.IsMatch(normalized,@"(?:^|\s)(?:آن|اون|این|همان|همون|قبلی|بعدی|اولی|دومی|سومی|وی|او|ایشان)(?:\s|$)")) return true;
        return Regex.IsMatch(normalized,@"(?:خبرش|اخبارش|قیمتش|حجمش|ارزشش|نمادش|شرکتش|مدیرعاملش|سمتش|نقشش|تاریخش|دلیلش|علتش|وضعیتش|سابقه(?:‌|\s)?اش)(?:\s|$)");
    }

    private static bool ContainsWholeCue(string normalized,string cue)
        => Regex.IsMatch(normalized,$@"(?<![\p{{L}}\p{{N}}]){Regex.Escape(cue)}(?![\p{{L}}\p{{N}}])",RegexOptions.CultureInvariant);

    private static bool ContainsAny(string value,params string[] candidates)
        => candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));

    private static bool IsCompanyHallFollowUp(ConversationReference reference,string normalized,bool standalone)
    {
        if(CanonicalFinancialInstitutionQuestion.Parse(normalized).IsMatch
           ||CanonicalContentQuestion.Parse(normalized).IsMatch
           ||LooksLikeExplicitMarketQuestion(normalized)) return false;
        var companyAnaphora=ContainsAny(normalized,"شرکتاش","شرکتاشون","شرکت هاش","شرکتهاش","شرکت ها","شرکت های","شرکتای","اسمشون","نامشون","اسامی شون","تعدادشون","چندتاشون","چنتاشون","همشون","فقط اسامی","فقط نام");
        if(reference.Kind=="hall"&&!ContainsAny(normalized,"شرکتاش","شرکت هاش","شرکتهاش","شرکتای","شرکت ها","شرکت های","شرکت‌های")) return false;
        return CompanyHallFollowUps.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))&&(companyAnaphora||!standalone);
    }

    private static bool IsFinancialHallFollowUp(string normalized,bool standalone)
    {
        if(CanonicalCompanyQuestion.Parse(normalized).IsMatch
           ||CanonicalContentQuestion.Parse(normalized).IsMatch
           ||LooksLikeExplicitMarketQuestion(normalized)) return false;
        var anaphora=ContainsAny(normalized,"نهادها","نهاداش","نهادهاش","نهاد هاش","نهادای مالی","کارگزاری ها","کارگزاریهاش","کارگزاری هاش","کارگزاریاش","سبدگردان ها","سبدگرداناش","سبدگردان هاش","مشاوراش","اسمشون","نامشون","اسامی شون","تعدادشون","چندتاشون","چنتاشون","همشون","فقط اسامی","فقط نام","آدرسشون","نشونیشون","تلفنشون");
        return FinancialHallFollowUps.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))&&(anaphora||!standalone);
    }

    private static bool IsFinancialHallCrossDomainFollowUp(string normalized)
        =>ContainsAny(normalized,"نهادها","نهاداش","نهادهاش","نهاد هاش","نهادای مالی",
            "کارگزاری","کارگزاریاش","سبدگردان","مشاوراش","مشاوران","تامین سرمایه","تأمین سرمایه");

    private static bool IsCompanyHallCrossDomainFollowUp(string normalized)
        =>ContainsAny(normalized,"شرکتاش","شرکتاشون","شرکت هاش","شرکتهاش","شرکت ها","شرکت های","شرکتای","کمپانیاش");

    private static string BuildFinancialHallFollowUp(string normalized,string hallName,string? type)
    {
        var entity=string.IsNullOrWhiteSpace(type)?"نهادهای مالی":$"{type}‌های";
        return ContainsAny(normalized,"چند","چندتا","چنتا","تعداد","شمارش")
            ? $"تعداد {entity} تالار {hallName} چقدر است؟"
            : ContainsAny(normalized,"آدرس","نشانی","نشونی")
                ? $"فهرست {entity} تالار {hallName} را همراه آدرس بگو."
                : ContainsAny(normalized,"تلفن","تماس")
                    ? $"فهرست {entity} تالار {hallName} را همراه شماره تماس بگو."
                    : $"فهرست {entity} تالار {hallName} را فقط نام‌ها بگو.";
    }

    private static string BuildRegionalHallFollowUp(string normalized,string hallName)
        => ContainsAny(normalized,"آدرس","نشانی","نشونی","مکان","کجاست","کجا قرار")
            ? $"آدرس فیزیکی تالار {hallName} کجاست؟"
            : ContainsAny(normalized,"تلفن","شماره تماس")
                ? $"شماره تماس تالار {hallName} چیست؟"
                : ContainsAny(normalized,"کد")
                    ? $"کد تالار {hallName} چیست؟"
                    : ContainsAny(normalized,"معاونت","بالادست","زیر مجموعه","زیرمجموعه")
                        ? $"تالار {hallName} زیرمجموعه کدام معاونت است؟"
                        : $"آخرین بروزرسانی تالار {hallName} چه زمانی بوده است؟";

    private static bool IsOrganizationRosterFollowUp(ConversationReference reference,string normalized)
        => reference.Kind is "organization_board" or "organization_unit"
            && (OrganizationRosterFollowUps.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))
                || OrganizationRosterFacetCues.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal))
                    && PluralReferenceCues.Any(cue=>normalized.Contains(cue,StringComparison.Ordinal)));

    private static string BuildOrganizationRosterQuestion(string question,ConversationReference reference)
        => reference.Kind=="organization_board"
            ? $"{question}؛ اعضای {reference.Topic}"
            : $"{question}؛ مدیران زیرمجموعه {reference.SubjectRole??reference.Topic} بورس تهران";
}

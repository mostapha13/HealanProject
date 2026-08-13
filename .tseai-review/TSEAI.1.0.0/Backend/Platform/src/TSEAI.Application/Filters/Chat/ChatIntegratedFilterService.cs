using System.Text.RegularExpressions;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Filters.Execution;
using TSEAI.Application.Filters.Temporal;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Filters.Chat;

public sealed record ChatFilterDetection(bool IsFilter,bool IsDirectDsl,bool RequiresHistory,string Reason);

public interface IChatFilterIntentDetector
{
    ChatFilterDetection Detect(string text);
}

public sealed class DeterministicChatFilterIntentDetector : IChatFilterIntentDetector
{
    private static readonly Regex FieldToken = new(@"\((?:l18|l30|tno|tvol|tval|py|pf|pmin|pmax|pl|plc|plp|pc|pcc|pcp|eps|pe|tmin|tmax|z|mv|bvol|cs|buyop|predtran|pd[1-5]|po[1-5]|zd[1-5]|zo[1-5]|qd[1-5]|qo[1-5]|ct)\)", RegexOptions.IgnoreCase|RegexOptions.Compiled);
    private static readonly string[] ExplicitFilterTerms = [
        "فیلتر کن","فیلترش کن","فیلتر بساز","فیلتر ایجاد","فیلتر بازار","فیلتر سهم","فیلتر نماد",
        "صف خریدها","صف فروش ها","صف فروش‌ها","شرط فیلتر","کد فیلتر","فیلتر tsetmc","فیلتر بورس"
    ];
    private static readonly string[] ConversationalEditTerms = [
        "شرط اول","شرط دوم","شرط سوم","شرط چهارم","شرط پنجم","شرط آخر","آخرین شرط","این شرط",
        "صف خرید","صف فروش","قدرت خریدار","قدرت خرید",
        "یک مرحله برگرد","برگرد به قبل","دوباره اعمال","redo","undo",
        "فیلتر فعلی","فیلترم چیه","شرط های فعلی","شرط‌های فعلی","توضیح فیلتر","فیلتر رو توضیح","فیلتر را توضیح",
        "فیلتر رو اجرا","فیلتر را اجرا","اجراش کن","همین رو اجرا","همین را اجرا",
        "p/e رو","p/e را","پی به ای رو","پی به ای را","حجم معاملات رو","ارزش معاملات رو","تعداد معاملات رو"
    ];

    public ChatFilterDetection Detect(string text)
    {
        var normalized=(text??string.Empty).Replace('ي','ی').Replace('ك','ک').Replace("‌"," ").Trim().ToLowerInvariant();
        var direct = FieldToken.IsMatch(normalized) && Regex.IsMatch(normalized,@"(==|!=|>=|<=|>|<|&&|\|\|)");
        var history = normalized.Contains("[ih]",StringComparison.OrdinalIgnoreCase);
        if (direct || history) return new(true,true,history,direct?"tsetmc-dsl":"historical-tsetmc-dsl");
        var explicitNl=ExplicitFilterTerms.Any(normalized.Contains);
        var conversationalEdit=IsConversationalEdit(normalized);
        if (explicitNl) return new(true,false,false,"explicit-natural-language-filter");
        if (conversationalEdit) return new(true,false,false,"conversational-filter-edit");
        return new(false,false,false,"not-filter");
    }

    public static bool IsConversationalEdit(string text)
    {
        var normalized=(text??string.Empty).Replace('ي','ی').Replace('ك','ک').Replace("‌"," ").Trim().ToLowerInvariant();
        return ConversationalEditTerms.Any(normalized.Contains);
    }

    public static string ExtractDsl(string text)
    {
        var cleaned=(text??string.Empty).Replace("```javascript",string.Empty,StringComparison.OrdinalIgnoreCase)
            .Replace("```js",string.Empty,StringComparison.OrdinalIgnoreCase).Replace("```",string.Empty).Trim();
        var m=Regex.Match(cleaned,@"\((?:l18|l30|tno|tvol|tval|py|pf|pmin|pmax|pl|plc|plp|pc|pcc|pcp|eps|pe|tmin|tmax|z|mv|bvol|cs|buyop|predtran|pd[1-5]|po[1-5]|zd[1-5]|zo[1-5]|qd[1-5]|qo[1-5]|ct)\)",RegexOptions.IgnoreCase);
        return m.Success?cleaned[m.Index..].Trim():cleaned;
    }
}

public sealed class ChatIntegratedFilterService(
    IChatFilterIntentDetector detector,
    IFilterTemporalPolicy temporalPolicy,
    ConversationFilterService conversation)
{
    public ChatFilterDetection Detect(string text)=>detector.Detect(text);

    public Task<ConversationFilterResult> ExecuteAsync(
        string subject,string conversationId,string question,TemporalResolution temporal,FilterExecutionOptions options,CancellationToken ct,string? fallbackSubject=null)
    {
        var detection=detector.Detect(question);
        if(!detection.IsFilter) throw new InvalidOperationException("Input is not an explicit chat filter request.");
        var temporalDecision=temporalPolicy.Evaluate(temporal);
        if(!temporalDecision.CanExecute)
            return Task.FromResult(new ConversationFilterResult(false,conversationId,"temporal_guard",null,null,1,0,false,false,[],null,null,null,null,null,null,null,null,temporalDecision.Message));
        if(detection.RequiresHistory)
            return Task.FromResult(new ConversationFilterResult(false,conversationId,"historical_unavailable",null,null,1,0,false,false,[],null,null,null,null,null,null,null,null,
                "فیلتر [ih] به MarketDailyHistory نیاز دارد؛ منبع تاریخچه هنوز به TSEAI متصل نشده و اجرا برای جلوگیری از نتیجه ساختگی متوقف شد."));
        var preparedQuestion=temporalPolicy.RemoveTemporalExpression(question,temporal);
        var editRequest=DeterministicChatFilterIntentDetector.IsConversationalEdit(preparedQuestion);
        return detection.IsDirectDsl && !editRequest
            ? conversation.ImportDslAsync(subject,conversationId,DeterministicChatFilterIntentDetector.ExtractDsl(preparedQuestion),options,ct,fallbackSubject)
            : conversation.ProcessAsync(subject,conversationId,preparedQuestion,options,ct,fallbackSubject);
    }
}

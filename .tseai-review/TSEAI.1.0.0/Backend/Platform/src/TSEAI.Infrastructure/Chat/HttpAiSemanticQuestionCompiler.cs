using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiSemanticQuestionCompiler(
    HttpClient http,
    ILogger<HttpAiSemanticQuestionCompiler> logger) : ISemanticQuestionCompiler
{
    private static readonly HashSet<string> AllowedMetrics=new(StringComparer.OrdinalIgnoreCase)
    {
        "identity","price","last_price","closing_price","trade_volume","trade_value","market_value","trade_count","pe","eps","observed_at",
        "order_book","best_bid","best_ask","spread","client_type","real_buy_volume","real_sell_volume","legal_buy_volume","legal_sell_volume",
        "company_title","symbol","hall","phone","website","ceo","ipo_date","company_state","state_reason","board_members",
        "person_name","role","representation","parent_unit","subordinates","content_title","content_body","publish_at","count"
    };
    private static readonly HashSet<string> AllowedEntityKinds=new(StringComparer.OrdinalIgnoreCase)
    {
        "symbol","company","person","organization","regional_hall","financial_institution","content","index","role","unknown"
    };

    public async Task<SemanticQuestionFrame?> CompileAsync(string question,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(question)) return null;
        try
        {
            using var response=await http.PostAsJsonAsync("chat/semantic-compile",new { question },ct);
            if(!response.IsSuccessStatusCode)
            {
                logger.LogWarning("AI semantic compiler returned HTTP {Status}.",(int)response.StatusCode);
                return null;
            }
            var dto=await response.Content.ReadFromJsonAsync<CompilerDto>(cancellationToken:ct);
            if(dto is null||!TryDomain(dto.Domain,out var domain)||!TryOperation(dto.Operation,out var operation)||!TryShape(dto.ResponseShape,out var shape))
                return null;
            var rawEntities=dto.Entities??[];
            var rawMetrics=dto.Metrics??[];
            if(rawEntities.Length>4||rawMetrics.Length>16
               ||rawEntities.Any(x=>string.IsNullOrWhiteSpace(x.Kind)||string.IsNullOrWhiteSpace(x.Value)||!AllowedEntityKinds.Contains(x.Kind))
               ||rawMetrics.Any(x=>string.IsNullOrWhiteSpace(x)||!AllowedMetrics.Contains(x)))
                return null;
            var entities=rawEntities
                .Select(x=>new SemanticEntityMention(Clean(x.Kind!,40),Clean(x.Value!,200))).ToArray();
            var metrics=rawMetrics.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var canonical=Clean(dto.CanonicalQuestion,1000);
            var clarification=Clean(dto.Clarification,500);
            var reasons=(dto.Reasons??[]).Where(x=>!string.IsNullOrWhiteSpace(x)).Take(8).Select(x=>Clean(x,100)).ToArray();
            if(string.IsNullOrWhiteSpace(canonical)||!IsSafeRewrite(question,canonical,entities)) return null;
            if(dto.RequiresClarification&&string.IsNullOrWhiteSpace(clarification)) return null;
            return new(question,canonical,domain,operation,entities,metrics,Clean(dto.TemporalExpression,120),shape,
                Math.Clamp(dto.Confidence,0,0.98),dto.RequiresClarification,clarification,reasons);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception exception)
        {
            logger.LogWarning(exception,"AI semantic compiler is unavailable; deterministic routing will continue.");
            return null;
        }
    }

    private static bool IsSafeRewrite(string original,string canonical,IReadOnlyList<SemanticEntityMention> entities)
    {
        if(canonical.Length>1000||canonical.IndexOfAny(['\r','\n','\0'])>=0) return false;
        var source=Normalize(original);
        var target=Normalize(canonical);
        foreach(var entity in entities)
        {
            var value=Normalize(entity.Value);
            if(value.Length<2||!source.Contains(value,StringComparison.Ordinal)||!target.Contains(value,StringComparison.Ordinal)) return false;
        }
        var sourceTerms=source.Split(' ',StringSplitOptions.RemoveEmptyEntries).Where(x=>x.Length>1).ToHashSet(StringComparer.Ordinal);
        var targetTerms=target.Split(' ',StringSplitOptions.RemoveEmptyEntries).ToHashSet(StringComparer.Ordinal);
        // Named entities are exact-copy guarded above. Requiring two additional
        // shared tokens rejects legitimate Persian paraphrases such as
        // «چند دست به دست شده» -> «حجم معاملات».
        return sourceTerms.Count==0||sourceTerms.Any(targetTerms.Contains);
    }

    private static string Normalize(string? value)=>Regex.Replace(PersianDisplayText.Normalize(value??string.Empty)
        .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('‌',' ').ToLowerInvariant(),@"[^\p{L}\p{Nd}]+"," ").Trim();
    private static string Clean(string? value,int maximum)
    {
        var cleaned=Regex.Replace(value??string.Empty,@"\s+"," ").Trim();
        return cleaned.Length<=maximum?cleaned:cleaned[..maximum];
    }

    private static bool TryDomain(string? value,out SemanticQuestionDomain result)
    {
        result=(value??string.Empty).Trim().ToLowerInvariant() switch
        {
            "market" or "cashmarket" => SemanticQuestionDomain.Market,
            "company" => SemanticQuestionDomain.Company,
            "company_state" or "companystate" => SemanticQuestionDomain.CompanyState,
            "instrument" => SemanticQuestionDomain.Instrument,
            "order_book" or "orderbook" => SemanticQuestionDomain.OrderBook,
            "client_type" or "clienttype" => SemanticQuestionDomain.ClientType,
            "financial_institution" or "nahad_mali" => SemanticQuestionDomain.FinancialInstitution,
            "content" or "news" => SemanticQuestionDomain.Content,
            "organization" or "person" => SemanticQuestionDomain.Organization,
            "market_filter" or "filter" => SemanticQuestionDomain.MarketFilter,
            "knowledge" => SemanticQuestionDomain.Knowledge,
            "unknown" => SemanticQuestionDomain.Unknown,
            _ => (SemanticQuestionDomain)(-1)
        };
        return (int)result>=0;
    }

    private static bool TryOperation(string? value,out SemanticQuestionOperation result)
        => Enum.TryParse((value??string.Empty).Replace("_",string.Empty,StringComparison.Ordinal),true,out result);

    private static bool TryShape(string? value,out SemanticResponseShape result)
    {
        var normalized=(value??string.Empty).Trim().Replace("_",string.Empty,StringComparison.Ordinal);
        return Enum.TryParse(normalized,true,out result);
    }

    private sealed record CompilerDto(
        string? Domain,
        string? Operation,
        EntityDto[]? Entities,
        string[]? Metrics,
        [property:JsonPropertyName("temporalExpression")] string? TemporalExpression,
        [property:JsonPropertyName("responseShape")] string? ResponseShape,
        [property:JsonPropertyName("canonicalQuestion")] string? CanonicalQuestion,
        double Confidence,
        [property:JsonPropertyName("requiresClarification")] bool RequiresClarification,
        string? Clarification,
        string[]? Reasons);
    private sealed record EntityDto(string? Kind,string? Value);
}

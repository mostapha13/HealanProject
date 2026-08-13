using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum AnswerValidationStatus { Grounded, Warning, Blocked }
public sealed record AnswerValidationReport(
    AnswerValidationStatus Status,
    bool IsValid,
    int NumericClaimCount,
    int CitationCount,
    IReadOnlyList<string> Issues);

public interface IAnswerValidationGuard
{
    AnswerValidationReport Validate(string answer, ChatIntent intent, IReadOnlyList<ChatEvidenceItem> evidence, EvidenceValidationReport evidenceValidation);
}

public sealed class DeterministicAnswerValidationGuard : IAnswerValidationGuard
{
    private static readonly Regex CitationRegex = new(@"\[(?<label>[MKQAF]\d+)\]", RegexOptions.Compiled);
    private static readonly Regex NumericRegex = new(@"(?<![A-Za-z])[-+]?\d[\d,]*(?:\.\d+)?%?", RegexOptions.Compiled);

    public AnswerValidationReport Validate(string answer, ChatIntent intent, IReadOnlyList<ChatEvidenceItem> evidence, EvidenceValidationReport evidenceValidation)
    {
        var issues=new List<string>();
        if(string.IsNullOrWhiteSpace(answer)) issues.Add("answer_empty");
        if(!evidenceValidation.IsValid) issues.AddRange(evidenceValidation.Issues.Select(x=>"evidence:"+x));

        var labels=evidence.Select(x=>x.CitationLabel).ToHashSet(StringComparer.Ordinal);
        var cited=CitationRegex.Matches(answer).Select(x=>x.Groups["label"].Value).Distinct(StringComparer.Ordinal).ToArray();
        foreach(var label in cited) if(!labels.Contains(label)) issues.Add("citation_without_evidence:"+label);

        var numericCount=NumericRegex.Matches(answer).Count;
        if(numericCount>0)
        {
            var numericAuthority=evidence.Any(x=>x.Authority is EvidenceAuthority.CanonicalMarketSnapshot or EvidenceAuthority.DeterministicCalculation or EvidenceAuthority.CanonicalQueryResult or EvidenceAuthority.FilterEngine);
            if(!numericAuthority && intent!=ChatIntent.Knowledge) issues.Add("numeric_claim_without_authoritative_evidence");
            if(intent==ChatIntent.Knowledge && evidence.Any(x=>x.Authority==EvidenceAuthority.QdrantGroundedEvidence) && !evidence.Any(x=>x.Authority!=EvidenceAuthority.QdrantGroundedEvidence))
            {
                // Numbers quoted from knowledge remain descriptive evidence, never canonical market facts.
                if(answer.Contains("قیمت امروز",StringComparison.Ordinal) || answer.Contains("حجم امروز",StringComparison.Ordinal)) issues.Add("knowledge_used_as_current_market_fact");
            }
        }

        if(intent is ChatIntent.MarketSymbol or ChatIntent.MarketComparison or ChatIntent.Hybrid)
            if(!evidence.Any(x=>x.Kind==EvidenceKind.StructuredFact)) issues.Add("market_answer_without_structured_fact");
        if(intent==ChatIntent.Hybrid && !evidence.Any(x=>x.Kind==EvidenceKind.KnowledgeDocument)) issues.Add("hybrid_answer_without_knowledge");

        var distinct=issues.Distinct(StringComparer.Ordinal).ToArray();
        var blocked=distinct.Any(x=>x.Contains("without",StringComparison.Ordinal) || x.StartsWith("evidence:",StringComparison.Ordinal) || x=="answer_empty");
        return new(blocked?AnswerValidationStatus.Blocked:(distinct.Length>0?AnswerValidationStatus.Warning:AnswerValidationStatus.Grounded),!blocked,numericCount,cited.Length,distinct);
    }
}

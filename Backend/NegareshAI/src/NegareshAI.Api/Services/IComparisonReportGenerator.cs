using System.Net.Http.Json;
using NegareshAI.Api.Application.Common.Dates;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Services;

public interface IComparisonReportGenerator
{
    Task<byte[]> GenerateAsync(
        ComparisonRun run, string format, CancellationToken cancellationToken);
}

public sealed class ComparisonReportGenerator(HttpClient httpClient)
    : IComparisonReportGenerator
{
    public async Task<byte[]> GenerateAsync(
        ComparisonRun run, string format, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            $"comparison/report?format={Uri.EscapeDataString(format)}", new
            {
                run.Id,
                TargetDocumentTitle = run.TargetDocument?.Title,
                run.TargetVersionId,
                BasisLabel = BasisLabel(run.BasisMode),
                OutcomeLabel = OutcomeLabel(run.Outcome),
                run.ScorePercent,
                run.PassingThreshold,
                run.HasCriticalFailure,
                run.OutcomeExplanation,
                ApprovalStatus = run.ApprovalStatus.ToString(),
                run.ModelId,
                run.PromptVersion,
                CreatedAtLabel = PersianDate.FormatDateTime(run.CreatedAtUtc),
                Findings = run.Findings.Select(item => new
                {
                    item.Title,
                    TypeLabel = TypeLabel(item.Type),
                    item.Severity,
                    item.Weight,
                    item.IsCritical,
                    item.IsApplicable,
                    item.IsPassed,
                    Reason = item.CorrectedReason ?? item.Reason,
                    item.TargetEvidence,
                    item.TargetPage,
                    item.ReferenceEvidence,
                    item.ReferencePage,
                    item.ReferenceSection,
                    item.ReferenceDocumentId,
                    item.ReferenceVersionId,
                    item.Suggestion,
                    item.Confidence,
                    ReviewLabel = ReviewLabel(item.ReviewDecision),
                    item.ReviewerComment
                })
            }, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private static string BasisLabel(ComparisonBasisMode value) => value switch
    {
        ComparisonBasisMode.DocumentGroup => "گروه اسناد",
        ComparisonBasisMode.RuleSets => "مجموعه قواعد",
        ComparisonBasisMode.ReferenceDocument => "سند مرجع",
        _ => "ترکیبی"
    };

    private static string OutcomeLabel(ComparisonOutcome? value) => value switch
    {
        ComparisonOutcome.Compliant => "منطبق",
        ComparisonOutcome.NonCompliant => "نامنطبق",
        _ => "نیازمند بررسی انسانی"
    };

    private static string TypeLabel(FindingType value) => value switch
    {
        FindingType.Matched => "منطبق",
        FindingType.Missing => "مفقود",
        FindingType.Forbidden => "عبارت ممنوع",
        FindingType.Different => "متفاوت",
        _ => "اضافی"
    };

    private static string ReviewLabel(FindingReviewDecision value) => value switch
    {
        FindingReviewDecision.Approved => "تأییدشده",
        FindingReviewDecision.Rejected => "ردشده",
        FindingReviewDecision.Corrected => "اصلاح‌شده",
        _ => "در انتظار بررسی"
    };
}

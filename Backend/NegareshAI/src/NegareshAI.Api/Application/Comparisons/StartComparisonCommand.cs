using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application.Comparisons;

public sealed record StartComparisonCommand(StartComparisonRequest Request)
    : IRequest<ComparisonRunResponse?>;

public sealed class StartComparisonCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IComparisonEngine engine,
    IAuditWriter audit,
    IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<StartComparisonCommand, ComparisonRunResponse?>
{
    public async Task<ComparisonRunResponse?> Handle(
        StartComparisonCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        ValidateBasis(request);
        var target = await db.Documents.Include(item => item.Versions)
            .SingleOrDefaultAsync(item => item.Id == request.TargetDocumentId
                && item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (target is null) return null;
        var targetVersion = request.TargetVersionId is null
            ? target.Versions.OrderByDescending(item => item.VersionNumber).FirstOrDefault()
            : target.Versions.SingleOrDefault(item => item.Id == request.TargetVersionId);
        if (targetVersion is null || string.IsNullOrWhiteSpace(targetVersion.ExtractedText)
            || targetVersion.LifecycleStatus is DocumentVersionLifecycleStatus.Rejected
                or DocumentVersionLifecycleStatus.Superseded)
            throw new InvalidOperationException("نسخه هدف استخراج‌شده و معتبر نیست.");

        var now = DateTime.UtcNow;
        DocumentGroup? group = null;
        var criteria = new List<ComparisonCriterionInput>();
        if (request.DocumentGroupId is not null)
        {
            if (authorizer is not null && !await authorizer.CanAccessAsync(
                    DataScopeResourceType.DocumentGroup, request.DocumentGroupId.Value,
                    cancellationToken)) return null;
            group = await db.DocumentGroups.AsNoTracking().SingleOrDefaultAsync(item =>
                item.Id == request.DocumentGroupId && item.OrganizationId == tenant.OrganizationId
                && item.IsActive, cancellationToken);
            if (group is null) return null;
            criteria = await db.DocumentGroupCriteria.AsNoTracking()
                .Where(item => item.DocumentGroupId == group.Id
                    && item.ComplianceCriterion!.OrganizationId == tenant.OrganizationId
                    && item.ComplianceCriterion.IsActive)
                .OrderBy(item => item.Order)
                .Select(item => new ComparisonCriterionInput(
                    item.ComplianceCriterionId, item.ComplianceCriterion!.Code,
                    item.ComplianceCriterion.Title, item.ComplianceCriterion.Description,
                    item.Weight, item.IsCritical, item.Order))
                .ToListAsync(cancellationToken);
            // Group criteria are intentionally optional. A group can be evaluated only
            // against its approved reference documents and per-run user instructions.
        }

        var ruleSetIds = request.RuleSetIds.Distinct().ToHashSet();
        if (group is not null)
        {
            var effectiveIds = await db.RuleSets.Where(item =>
                    item.OrganizationId == tenant.OrganizationId
                    && item.DocumentGroupId == group.Id && item.IsActive
                    && item.EffectiveFromUtc <= now
                    && (item.EffectiveToUtc == null || item.EffectiveToUtc > now))
                .Select(item => item.Id).ToListAsync(cancellationToken);
            ruleSetIds.UnionWith(effectiveIds);
        }
        var ruleSets = await db.RuleSets.Include(item => item.Rules)
            .ThenInclude(item => item.Parameters)
            .Where(item => item.OrganizationId == tenant.OrganizationId
                && ruleSetIds.Contains(item.Id) && item.IsActive
                && item.EffectiveFromUtc <= now
                && (item.EffectiveToUtc == null || item.EffectiveToUtc > now))
            .ToListAsync(cancellationToken);
        if (ruleSets.Count != ruleSetIds.Count) return null;

        var references = new List<ComparisonSource>();
        Guid? referenceVersionId = null;
        if (request.ReferenceDocumentId is not null)
        {
            var source = await LoadFinalReference(request.ReferenceDocumentId.Value,
                request.ReferenceVersionId, 0, cancellationToken);
            if (source is null) return null;
            referenceVersionId = source.VersionId;
            references.Add(source);
        }
        if (group is not null)
        {
            var goldenRows = await db.GoldenDocuments.AsNoTracking()
                .Where(item => item.OrganizationId == tenant.OrganizationId
                    && item.DocumentGroupId == group.Id && item.IsActive
                    && item.DocumentId != target.Id)
                .OrderBy(item => item.Priority)
                .Select(item => new { item.DocumentId, item.Priority })
                .ToListAsync(cancellationToken);
            foreach (var golden in goldenRows)
            {
                var source = await LoadFinalReference(golden.DocumentId, null,
                    golden.Priority, cancellationToken);
                if (source is not null) references.Add(source);
            }
            if (references.Count == 0)
                throw new InvalidOperationException(
                    "گروه فاقد مرجع معتبر است: سند مورد تأیید Final و منتشرشده وجود ندارد.");
        }
        references = references.GroupBy(item => item.VersionId)
            .Select(item => item.OrderBy(x => x.Priority).First())
            .OrderBy(item => item.Priority).ToList();

        var modelSetting = await RequiredSetting("ai", "embedding.model", cancellationToken);
        var promptSetting = await RequiredSetting("ai", "comparison.prompt", cancellationToken);
        var modelId = JsonValue(modelSetting.ValueJson, "modelId");
        var promptVersion = $"{promptSetting.Key}:v{promptSetting.Version}";
        var rulesSnapshot = ruleSets.Select(item => new
        {
            item.Id, item.Name, item.Version, item.EffectiveFromUtc, item.EffectiveToUtc,
            Rules = item.Rules.OrderBy(rule => rule.Order).Select(rule => new
            {
                rule.Id, rule.Code, rule.Title, rule.Instruction, rule.Severity,
                rule.Order, Parameters = rule.Parameters.Select(parameter =>
                    new { parameter.Key, parameter.ValueJson })
            })
        }).ToArray();
        var criterionSnapshot = new
        {
            PassingThreshold = group?.PassingThreshold ?? 100m,
            Criteria = criteria
        };
        var sourceSnapshot = references.Select(item => new
        {
            item.DocumentId, item.VersionId, item.Title, item.Priority,
            TextSha256 = Sha256(item.Text), ApprovalState = "final"
        }).ToArray();

        var drafts = engine.Evaluate(targetVersion.ExtractedText, criteria,
            ruleSets.SelectMany(item => item.Rules).ToArray(), references,
            request.UserInstruction);
        List<ComparisonConflictDecision> decisionRows = group is null ? []
            : await db.ComparisonConflictDecisions.AsNoTracking()
                .Where(item => item.OrganizationId == tenant.OrganizationId
                    && item.DocumentGroupId == group.Id
                    && item.Scope == ConflictDecisionScope.DocumentGroup)
                .OrderByDescending(item => item.DecidedAtUtc)
                .ToListAsync(cancellationToken);
        var persistentDecisions = decisionRows.GroupBy(item => item.DecisionKey)
            .ToDictionary(item => item.Key, item => item.First());

        var run = new ComparisonRun
        {
            OrganizationId = tenant.OrganizationId,
            TargetDocumentId = target.Id,
            TargetVersionId = targetVersion.Id,
            TargetDocument = target,
            BasisMode = request.BasisMode,
            DocumentGroupId = request.DocumentGroupId,
            ReferenceDocumentId = request.ReferenceDocumentId,
            ReferenceVersionId = referenceVersionId,
            UserInstruction = request.UserInstruction?.Trim(),
            RuleSetSnapshotJson = JsonSerializer.Serialize(rulesSnapshot),
            CriterionSnapshotJson = JsonSerializer.Serialize(criterionSnapshot),
            SourceSnapshotJson = JsonSerializer.Serialize(sourceSnapshot),
            ToolTraceJson = JsonSerializer.Serialize(new
            {
                Strategy = "two-pass-evidence-grounded",
                Tools = new[] { "target-version-resolver", "golden-source-retriever",
                    "criterion-rule-evaluator", "citation-verifier", "weighted-score-calculator" },
                Reflection = new { Passes = 2, CitationVerification = true,
                    ScoreRecalculation = true },
                Mcp = new { Used = false,
                    Reason = "منابع محرمانه از SQL/FileManager/RAG خصوصی و snapshot‌شده تأمین شدند؛ خروج از مرز اعتماد لازم نبود." }
            }),
            ModelId = modelId,
            PromptVersion = promptVersion,
            PassingThreshold = group?.PassingThreshold ?? 100m,
            CreatedByUserId = tenant.UserId,
            RuleSets = ruleSets.Select(item => new ComparisonRunRuleSet
            {
                RuleSetId = item.Id
            }).ToList()
        };
        run.Findings = drafts.Select(item => MapFinding(item, persistentDecisions)).ToList();
        Complete(run);
        db.ComparisonRuns.Add(run);
        audit.Add("comparison.m5-completed", nameof(ComparisonRun), run.Id.ToString(),
            new { run.Outcome, run.ScorePercent, run.HasCriticalFailure,
                run.PassingThreshold, Findings = run.Findings.Count,
                GoldenSources = references.Count });
        await db.SaveChangesAsync(cancellationToken);
        return ComparisonMapping.ToResponse(run);
    }

    private static ComparisonFinding MapFinding(ComparisonFindingDraft item,
        IReadOnlyDictionary<string, ComparisonConflictDecision> decisions)
    {
        var key = DecisionKey(item.ComplianceCriterionId, item.RuleId, item.Title);
        decisions.TryGetValue(key, out var inherited);
        return new ComparisonFinding
        {
            RuleId = item.RuleId,
            ComplianceCriterionId = item.ComplianceCriterionId,
            Type = item.Type,
            Severity = item.Severity,
            Weight = item.Weight,
            IsCritical = item.IsCritical,
            IsApplicable = item.IsApplicable,
            IsPassed = inherited?.Decision == FindingReviewDecision.Rejected
                && item.IsApplicable ? true : item.IsPassed,
            Title = item.Title,
            Reason = item.Reason,
            TargetEvidence = item.TargetEvidence,
            TargetPage = item.TargetPage,
            TargetSection = item.TargetSection,
            ReferenceEvidence = item.ReferenceEvidence,
            ReferencePage = item.ReferencePage,
            ReferenceSection = item.ReferenceSection,
            ReferenceDocumentId = item.ReferenceDocumentId,
            ReferenceVersionId = item.ReferenceVersionId,
            Suggestion = item.Suggestion,
            Confidence = item.Confidence,
            ReviewDecision = inherited?.Decision ?? FindingReviewDecision.Pending,
            ReviewerComment = inherited is null ? null
                : $"تصمیم مرجع گروه: {inherited.Reason}",
            ReviewedByUserId = inherited?.DecidedByUserId,
            ReviewedAtUtc = inherited?.DecidedAtUtc
        };
    }

    public static string DecisionKey(Guid? criterionId, Guid? ruleId, string title) =>
        criterionId is not null ? $"criterion:{criterionId:N}"
        : ruleId is not null ? $"rule:{ruleId:N}"
        : $"title:{Sha256(title)}";

    private async Task<ComparisonSource?> LoadFinalReference(Guid documentId,
        Guid? versionId, int priority, CancellationToken cancellationToken)
    {
        var document = await db.Documents.AsNoTracking().Include(item => item.Versions)
            .SingleOrDefaultAsync(item => item.Id == documentId
                && item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (document is null) return null;
        var versions = document.Versions.Where(item =>
            item.LifecycleStatus == DocumentVersionLifecycleStatus.Final
            && item.IsRagPublished && !string.IsNullOrWhiteSpace(item.ExtractedText));
        var version = versionId is null
            ? versions.OrderByDescending(item => item.VersionNumber).FirstOrDefault()
            : versions.SingleOrDefault(item => item.Id == versionId);
        return version is null ? null : new(document.Id, version.Id, document.Title,
            version.ExtractedText!, priority);
    }

    private async Task<RuntimeSetting> RequiredSetting(string category, string key,
        CancellationToken cancellationToken) =>
        await db.RuntimeSettings.AsNoTracking().SingleOrDefaultAsync(item =>
            item.OrganizationId == tenant.OrganizationId && item.Category == category
            && item.Key == key && item.IsActive, cancellationToken)
        ?? throw new InvalidOperationException(
            key == "comparison.prompt"
                ? "تنظیم فعال تحلیل تطبیق اسناد در سازمان ثبت نشده است. مدیر سامانه باید تنظیم ai/comparison.prompt را فعال کند."
                : $"تنظیم فعال موردنیاز {category}/{key} در سازمان ثبت نشده است.");

    private static string JsonValue(string json, string property)
    {
        using var value = JsonDocument.Parse(json);
        return value.RootElement.TryGetProperty(property, out var result)
            && !string.IsNullOrWhiteSpace(result.GetString())
            ? result.GetString()! : throw new InvalidOperationException(
                $"Runtime setting must contain {property}.");
    }

    private static string Sha256(string value) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    private static void ValidateBasis(StartComparisonRequest request)
    {
        var hasGroup = request.DocumentGroupId is not null;
        var hasRules = request.RuleSetIds.Count > 0;
        var hasReference = request.ReferenceDocumentId is not null;
        var valid = request.BasisMode switch
        {
            ComparisonBasisMode.DocumentGroup => hasGroup && !hasRules && !hasReference,
            ComparisonBasisMode.RuleSets => hasRules && !hasGroup && !hasReference,
            ComparisonBasisMode.ReferenceDocument => hasReference && !hasGroup && !hasRules,
            ComparisonBasisMode.Combined => new[] { hasGroup, hasRules, hasReference,
                !string.IsNullOrWhiteSpace(request.UserInstruction) }.Count(item => item) >= 2,
            _ => false
        };
        if (!valid) throw new ArgumentException(
            "The selected comparison basis does not match its inputs.");
    }

    public static void Complete(ComparisonRun run)
    {
        var scorable = run.Findings.Where(item => item.IsApplicable && item.Weight > 0).ToArray();
        var denominator = scorable.Sum(item => item.Weight);
        run.ScorePercent = denominator == 0 ? 0 : decimal.Round(
            scorable.Where(item => item.IsPassed).Sum(item => item.Weight)
            * 100m / denominator, 2);
        run.HasCriticalFailure = scorable.Any(item => item.IsCritical && !item.IsPassed);
        var uncertain = run.Findings.Any(item => item.Confidence < 0.5m);
        run.Outcome = run.HasCriticalFailure || run.ScorePercent < run.PassingThreshold
            ? ComparisonOutcome.NonCompliant
            : uncertain ? ComparisonOutcome.NeedsHumanReview : ComparisonOutcome.Compliant;
        run.OutcomeExplanation = run.HasCriticalFailure
            ? $"با وجود امتیاز {run.ScorePercent:0.##}، حداقل یک معیار حیاتی نقض شده است."
            : $"امتیاز وزنی {run.ScorePercent:0.##} از مجموع وزن معیارهای قابل اعمال؛ آستانه گروه {run.PassingThreshold:0.##} است.";
        run.Status = run.Outcome == ComparisonOutcome.NeedsHumanReview
            ? ComparisonRunStatus.NeedsReview : ComparisonRunStatus.Completed;
        run.CompletedAtUtc = DateTime.UtcNow;
    }
}

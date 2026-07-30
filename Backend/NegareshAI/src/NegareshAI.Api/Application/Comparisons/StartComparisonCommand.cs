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
            .SingleOrDefaultAsync(item =>
                item.Id == request.TargetDocumentId
                && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (target is null) return null;
        var targetVersion = request.TargetVersionId is null
            ? target.Versions.MaxBy(item => item.VersionNumber)
            : target.Versions.SingleOrDefault(item => item.Id == request.TargetVersionId);
        if (targetVersion is null || string.IsNullOrWhiteSpace(targetVersion.ExtractedText))
            throw new InvalidOperationException("Target document version is not processed.");

        var now = DateTime.UtcNow;
        var ruleSetIds = request.RuleSetIds.Distinct().ToHashSet();
        if (request.DocumentGroupId is not null)
        {
            if (authorizer is not null && !await authorizer.CanAccessAsync(
                    DataScopeResourceType.DocumentGroup, request.DocumentGroupId.Value,
                    cancellationToken))
                return null;
            var groupExists = await db.DocumentGroups.AnyAsync(item =>
                item.Id == request.DocumentGroupId
                && item.OrganizationId == tenant.OrganizationId && item.IsActive,
                cancellationToken);
            if (!groupExists) return null;
            var groupRuleSetIds = await db.RuleSets.Where(item =>
                    item.OrganizationId == tenant.OrganizationId
                    && item.DocumentGroupId == request.DocumentGroupId
                    && item.IsActive && item.EffectiveFromUtc <= now
                    && (item.EffectiveToUtc == null || item.EffectiveToUtc > now))
                .Select(item => item.Id).ToListAsync(cancellationToken);
            ruleSetIds.UnionWith(groupRuleSetIds);
        }

        var ruleSets = await db.RuleSets
            .Include(item => item.Rules).ThenInclude(item => item.Parameters)
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
            var source = await LoadReference(
                request.ReferenceDocumentId.Value, request.ReferenceVersionId,
                cancellationToken);
            if (source is null) return null;
            referenceVersionId = source.VersionId;
            references.Add(source);
        }
        if (request.DocumentGroupId is not null)
        {
            var groupSources = await db.DocumentGroupMembers.AsNoTracking()
                .Where(item => item.DocumentGroupId == request.DocumentGroupId
                    && item.Document!.OrganizationId == tenant.OrganizationId
                    && item.DocumentId != target.Id)
                .Select(item => new
                {
                    item.DocumentId,
                    item.Document!.Title,
                    Version = item.Document.Versions
                        .OrderByDescending(version => version.VersionNumber).FirstOrDefault()
                }).ToListAsync(cancellationToken);
            references.AddRange(groupSources.Where(item =>
                    item.Version is not null
                    && !string.IsNullOrWhiteSpace(item.Version.ExtractedText))
                .Select(item => new ComparisonSource(
                    item.DocumentId, item.Version!.Id, item.Title,
                    item.Version.ExtractedText!)));
        }
        references = references.GroupBy(item => item.VersionId)
            .Select(item => item.First()).ToList();

        var modelSetting = await RequiredSetting("ai", "embedding.model", cancellationToken);
        var promptSetting = await RequiredSetting("ai", "comparison.prompt", cancellationToken);
        var modelId = JsonValue(modelSetting.ValueJson, "modelId");
        var promptVersion = $"{promptSetting.Key}:v{promptSetting.Version}";
        var snapshot = ruleSets.Select(item => new
        {
            item.Id, item.Name, item.Version, item.EffectiveFromUtc, item.EffectiveToUtc,
            Rules = item.Rules.Select(rule => new
            {
                rule.Id, rule.Code, rule.Title, rule.Instruction,
                rule.Severity, rule.Order,
                Parameters = rule.Parameters.Select(parameter =>
                    new { parameter.Key, parameter.ValueJson })
            })
        });
        var sourceSnapshot = references.Select(item =>
            new { item.DocumentId, item.VersionId, item.Title });

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
            RuleSetSnapshotJson = JsonSerializer.Serialize(snapshot),
            SourceSnapshotJson = JsonSerializer.Serialize(sourceSnapshot),
            ModelId = modelId,
            PromptVersion = promptVersion,
            CreatedByUserId = tenant.UserId,
            RuleSets = ruleSets.Select(item => new ComparisonRunRuleSet
            {
                RuleSetId = item.Id
            }).ToList()
        };
        db.ComparisonRuns.Add(run);
        var drafts = engine.Evaluate(targetVersion.ExtractedText,
            ruleSets.SelectMany(item => item.Rules).ToArray(),
            references, request.UserInstruction);
        run.Findings = drafts.Select(item => new ComparisonFinding
        {
            RuleId = item.RuleId,
            Type = item.Type,
            Severity = item.Severity,
            Title = item.Title,
            Reason = item.Reason,
            TargetEvidence = item.TargetEvidence,
            TargetPage = item.TargetPage,
            TargetSection = item.TargetSection,
            ReferenceEvidence = item.ReferenceEvidence,
            ReferencePage = item.ReferencePage,
            Suggestion = item.Suggestion,
            Confidence = item.Confidence
        }).ToList();
        Complete(run);
        audit.Add("comparison.completed", nameof(ComparisonRun), run.Id.ToString(),
            new { run.BasisMode, run.Outcome, run.ScorePercent, findings = run.Findings.Count });
        await db.SaveChangesAsync(cancellationToken);
        return ComparisonMapping.ToResponse(run);
    }

    private async Task<ComparisonSource?> LoadReference(
        Guid documentId, Guid? versionId, CancellationToken cancellationToken)
    {
        var document = await db.Documents.AsNoTracking().Include(item => item.Versions)
            .SingleOrDefaultAsync(item =>
                item.Id == documentId && item.OrganizationId == tenant.OrganizationId,
                cancellationToken);
        if (document is null) return null;
        var version = versionId is null
            ? document.Versions.MaxBy(item => item.VersionNumber)
            : document.Versions.SingleOrDefault(item => item.Id == versionId);
        return version is null || string.IsNullOrWhiteSpace(version.ExtractedText)
            ? null : new(document.Id, version.Id, document.Title, version.ExtractedText);
    }

    private async Task<RuntimeSetting> RequiredSetting(
        string category, string key, CancellationToken cancellationToken) =>
        await db.RuntimeSettings.AsNoTracking().SingleOrDefaultAsync(item =>
            item.OrganizationId == tenant.OrganizationId
            && item.Category == category && item.Key == key && item.IsActive,
            cancellationToken) ?? throw new InvalidOperationException(
                $"Active runtime setting {category}/{key} is required.");

    private static string JsonValue(string json, string property)
    {
        using var value = JsonDocument.Parse(json);
        return value.RootElement.TryGetProperty(property, out var result)
            && !string.IsNullOrWhiteSpace(result.GetString())
            ? result.GetString()! : throw new InvalidOperationException(
                $"Runtime setting must contain {property}.");
    }

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
            ComparisonBasisMode.Combined =>
                new[] { hasGroup, hasRules, hasReference,
                    !string.IsNullOrWhiteSpace(request.UserInstruction) }
                    .Count(item => item) >= 2,
            _ => false
        };
        if (!valid) throw new ArgumentException(
            "The selected comparison basis does not match its inputs.");
    }

    private static void Complete(ComparisonRun run)
    {
        var relevant = run.Findings.Where(item => item.Type != FindingType.Matched).ToArray();
        var matched = run.Findings.Count(item => item.Type == FindingType.Matched);
        run.ScorePercent = run.Findings.Count == 0 ? 0
            : decimal.Round(matched * 100m / run.Findings.Count, 2);
        run.Outcome = relevant.Any(item => item.Severity >= 4)
            ? ComparisonOutcome.NonCompliant
            : relevant.Length > 0 || run.Findings.Count == 0
                ? ComparisonOutcome.NeedsHumanReview
                : ComparisonOutcome.Compliant;
        run.Status = run.Outcome == ComparisonOutcome.NeedsHumanReview
            ? ComparisonRunStatus.NeedsReview : ComparisonRunStatus.Completed;
        run.CompletedAtUtc = DateTime.UtcNow;
    }
}

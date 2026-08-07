using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Comparisons;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.MasterData;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class M5DocumentConformityTests
{
    [Fact]
    public void Direct_pair_comparison_reports_changed_and_added_content_with_two_sided_evidence()
    {
        var reference = new ComparisonSource(Guid.NewGuid(), Guid.NewGuid(), "سند دوم",
            "مبلغ قرارداد ۱۰۰ میلیون ریال است.\nمدت قرارداد یک سال است.");

        var findings = new ComparisonEngine().Evaluate(
            "مبلغ قرارداد ۱۵۰ میلیون ریال است.\nمدت قرارداد یک سال است.\nبند محرمانگی اضافه شد.",
            [], [], [reference], "مبلغ و محرمانگی را مقایسه کن");

        Assert.Contains(findings, x => x.Type == FindingType.Different
            && x.TargetEvidence is not null && x.ReferenceEvidence is not null);
        Assert.Contains(findings, x => x.Type == FindingType.Extra
            && x.TargetEvidence!.Contains("محرمانگی"));
        Assert.Contains(findings, x => x.Title == "تمرکز درخواستی کاربر");
    }

    [Fact]
    public void Group_sources_are_compared_like_multiple_reference_files()
    {
        var first = new ComparisonSource(Guid.NewGuid(), Guid.NewGuid(), "مرجع اول",
            "مبلغ قرارداد ۱۰۰ میلیون ریال است.", 1);
        var second = new ComparisonSource(Guid.NewGuid(), Guid.NewGuid(), "مرجع دوم",
            "مدت قرارداد دو سال است.", 2);

        var findings = new ComparisonEngine().Evaluate(
            "مبلغ قرارداد ۱۵۰ میلیون ریال است. مدت قرارداد یک سال است.",
            [], [], [first, second], null);

        Assert.Contains(findings, x => x.ReferenceDocumentId == first.DocumentId);
        Assert.Contains(findings, x => x.ReferenceDocumentId == second.DocumentId);
        Assert.All(findings, x => Assert.True(x.IsApplicable));
    }

    [Fact]
    public void Approved_references_are_scorable_when_group_has_no_optional_criteria()
    {
        var reference = new ComparisonSource(Guid.NewGuid(), Guid.NewGuid(), "مرجع",
            "نام شرکت مبلغ تاریخ امضا محرمانگی تعهدات");

        var findings = new ComparisonEngine().Evaluate(
            "نام شرکت مبلغ تاریخ امضا محرمانگی تعهدات", [], [], [reference], null);

        var finding = Assert.Single(findings);
        Assert.True(finding.IsApplicable);
        Assert.Equal(1m, finding.Weight);
        Assert.True(finding.IsPassed);
    }

    [Fact]
    public void Per_run_important_item_participates_in_the_score()
    {
        var findings = new ComparisonEngine().Evaluate(
            "این سند دارای مبلغ و تاریخ است", [], [], [], "بند محرمانگی");

        var finding = Assert.Single(findings);
        Assert.True(finding.IsApplicable);
        Assert.Equal(1m, finding.Weight);
        Assert.False(finding.IsPassed);
    }

    [Fact]
    public async Task Readding_a_deleted_approved_reference_restores_it_and_group_membership()
    {
        await using var db = CreateDb();
        var organizationId = Guid.NewGuid();
        var group = new DocumentGroup { OrganizationId = organizationId, Name = "گروه", CreatedByUserId = "u" };
        var document = new Document { OrganizationId = organizationId, Title = "مرجع", DocumentType = "reference" };
        var deleted = new GoldenDocument { OrganizationId = organizationId,
            DocumentGroupId = group.Id, DocumentId = document.Id, Priority = 1,
            CreatedByUserId = "u", IsDeleted = true, IsActive = false };
        db.AddRange(group, document, deleted); await db.SaveChangesAsync();

        var result = await new SaveGoldenDocumentHandler(db,
            new Tenant(organizationId, "u"), new NullAudit()).Handle(
            new(null, new SaveGoldenDocumentRequest(group.Id, document.Id, 2, true)), default);

        Assert.NotNull(result);
        Assert.False(deleted.IsDeleted);
        Assert.True(deleted.IsActive);
        Assert.True(await db.DocumentGroupMembers.AnyAsync(x =>
            x.DocumentGroupId == group.Id && x.DocumentId == document.Id));
    }

    [Fact]
    public async Task Freezes_final_golden_sources_and_critical_failure_overrides_high_score()
    {
        await using var db = CreateDb();
        var seeded = await SeedSteelScenario(db);
        var handler = new StartComparisonCommandHandler(db,
            new Tenant(seeded.OrganizationId, "expert"), new ComparisonEngine(), new NullAudit());

        var result = await handler.Handle(new(new StartComparisonRequest(
            seeded.TargetDocumentId, seeded.TargetVersionId,
            ComparisonBasisMode.DocumentGroup, seeded.GroupId, [], null, null, null)), default);

        Assert.NotNull(result);
        Assert.Equal(90m, result.ScorePercent);
        Assert.True(result.HasCriticalFailure);
        Assert.Equal(ComparisonOutcome.NonCompliant, result.Outcome);
        Assert.Contains("معیار حیاتی", result.OutcomeExplanation);
        using var sources = JsonDocument.Parse(result.SourceSnapshotJson);
        Assert.Equal(seeded.GoldenFinalVersionId,
            sources.RootElement[0].GetProperty("VersionId").GetGuid());
        Assert.DoesNotContain(seeded.GoldenDraftVersionId.ToString(), result.SourceSnapshotJson);
        Assert.Contains("citation-verifier", result.ToolTraceJson);
        Assert.Contains("two-pass", result.ToolTraceJson);
    }

    [Fact]
    public async Task Expert_result_approval_does_not_publish_until_manager_finalizes()
    {
        await using var db = CreateDb();
        var seeded = await SeedSteelScenario(db);
        var run = await new StartComparisonCommandHandler(db,
            new Tenant(seeded.OrganizationId, "expert"), new ComparisonEngine(), new NullAudit())
            .Handle(new(new StartComparisonRequest(seeded.TargetDocumentId,
                seeded.TargetVersionId, ComparisonBasisMode.DocumentGroup,
                seeded.GroupId, [], null, null, null)), default);
        Assert.NotNull(run);
        foreach (var finding in db.ComparisonFindings.Where(x => x.ComparisonRunId == run.Id))
            finding.ReviewDecision = FindingReviewDecision.Approved;
        await db.SaveChangesAsync();

        var approved = await new ReviewComparisonCommandHandler(db,
            new Tenant(seeded.OrganizationId, "expert"), new NullAudit())
            .Handle(new(run.Id, new ReviewComparisonRequest(true, "تأیید نتیجه")), default);
        var target = await db.DocumentVersions.SingleAsync(x => x.Id == seeded.TargetVersionId);
        Assert.Equal(ComparisonApprovalStatus.ExpertApproved, approved!.ApprovalStatus);
        Assert.Equal(DocumentVersionLifecycleStatus.ManagerReview, target.LifecycleStatus);
        Assert.False(target.IsRagPublished);

        var ai = new RecordingAi();
        await new ManagerReviewDocumentVersionCommandHandler(db,
            new Tenant(seeded.OrganizationId, "manager"), ai, new NullAudit())
            .Handle(new(seeded.TargetDocumentId, seeded.TargetVersionId, true, "نهایی"), default);
        var finalized = await db.ComparisonRuns.SingleAsync(x => x.Id == run.Id);
        Assert.Equal(1, ai.PublishCount);
        Assert.True(target.IsRagPublished);
        Assert.Equal(ComparisonApprovalStatus.ManagerFinalized, finalized.ApprovalStatus);
        var promoted = await db.GoldenDocuments.SingleAsync(x =>
            x.DocumentGroupId == seeded.GroupId && x.DocumentId == seeded.TargetDocumentId);
        Assert.True(promoted.IsActive);
    }

    [Fact]
    public async Task Group_conflict_decision_is_reused_by_the_next_run()
    {
        await using var db = CreateDb();
        var seeded = await SeedSteelScenario(db);
        var tenant = new Tenant(seeded.OrganizationId, "expert");
        var start = new StartComparisonCommandHandler(db, tenant,
            new ComparisonEngine(), new NullAudit());
        var first = await start.Handle(new(new StartComparisonRequest(
            seeded.TargetDocumentId, seeded.TargetVersionId,
            ComparisonBasisMode.DocumentGroup, seeded.GroupId, [], null, null, null)), default);
        var critical = first!.Findings.Single(x => x.IsCritical);
        await new ReviewFindingCommandHandler(db, tenant, new NullAudit()).Handle(
            new(critical.Id, new ReviewFindingRequest(FindingReviewDecision.Rejected,
                "این بند طبق مصوبه گروه قابل اغماض است", null, true)), default);

        var second = await start.Handle(new(new StartComparisonRequest(
            seeded.TargetDocumentId, seeded.TargetVersionId,
            ComparisonBasisMode.DocumentGroup, seeded.GroupId, [], null, null, null)), default);
        var inherited = second!.Findings.Single(x => x.IsCritical);
        Assert.Equal(FindingReviewDecision.Rejected, inherited.ReviewDecision);
        Assert.True(inherited.IsPassed);
        Assert.False(second.HasCriticalFailure);
        Assert.Equal(100m, second.ScorePercent);
    }

    [Fact]
    public async Task Group_comparison_fails_closed_without_criteria_or_final_golden_document()
    {
        await using var db = CreateDb();
        var organizationId = Guid.NewGuid();
        var target = new Document { OrganizationId = organizationId, Title = "هدف", DocumentType = "prospectus" };
        var version = new DocumentVersion { Document = target, DocumentId = target.Id,
            VersionNumber = 1, FileId = "target", ExtractedText = "متن",
            LifecycleStatus = DocumentVersionLifecycleStatus.Extracted };
        target.Versions.Add(version);
        var group = new DocumentGroup { OrganizationId = organizationId, Name = "فولاد", CreatedByUserId = "u" };
        db.AddRange(target, group, new DocumentGroupMember { DocumentId = target.Id, DocumentGroupId = group.Id });
        AddSettings(db, organizationId);
        await db.SaveChangesAsync();
        var handler = new StartComparisonCommandHandler(db, new Tenant(organizationId, "u"),
            new ComparisonEngine(), new NullAudit());

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(
            new(new StartComparisonRequest(target.Id, version.Id,
                ComparisonBasisMode.DocumentGroup, group.Id, [], null, null, null)), default));
        Assert.Contains("گروه فاقد مرجع معتبر است", error.Message);
    }

    [Fact]
    public async Task Reviewing_a_non_scorable_finding_does_not_reset_the_weighted_score()
    {
        var options = new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        SteelSeed seeded;
        ComparisonRunResponse run;
        await using (var db = new NegareshDbContext(options))
        {
            seeded = await SeedSteelScenario(db);
            run = (await new StartComparisonCommandHandler(db,
                new Tenant(seeded.OrganizationId, "expert"), new ComparisonEngine(),
                new NullAudit()).Handle(new(new StartComparisonRequest(
                    seeded.TargetDocumentId, seeded.TargetVersionId,
                    ComparisonBasisMode.DocumentGroup, seeded.GroupId, [], null, null, null)),
                    default))!;
        }

        foreach (var findingId in run.Findings.Select(x => x.Id))
        {
            await using var requestDb = new NegareshDbContext(options);
            await new ReviewFindingCommandHandler(requestDb,
                new Tenant(seeded.OrganizationId, "expert"), new NullAudit()).Handle(
                new(findingId, new ReviewFindingRequest(FindingReviewDecision.Approved,
                    "Reviewed", null)), default);
        }

        await using var verificationDb = new NegareshDbContext(options);
        var saved = await verificationDb.ComparisonRuns.SingleAsync(x => x.Id == run.Id);
        Assert.Equal(90m, saved.ScorePercent);
        Assert.True(saved.HasCriticalFailure);
    }

    [Fact]
    public async Task Report_download_persists_a_new_immutable_artifact_version()
    {
        await using var db = CreateDb();
        var seeded = await SeedSteelScenario(db);
        var tenant = new Tenant(seeded.OrganizationId, "expert");
        var run = await new StartComparisonCommandHandler(db, tenant,
            new ComparisonEngine(), new NullAudit()).Handle(new(new StartComparisonRequest(
                seeded.TargetDocumentId, seeded.TargetVersionId,
                ComparisonBasisMode.DocumentGroup, seeded.GroupId, [], null, null, null)), default);
        var handler = new GenerateComparisonReportQueryHandler(db, tenant,
            new StubReportGenerator(), new NullAudit());

        var first = await handler.Handle(new(run!.Id, "docx"), default);
        var second = await handler.Handle(new(run.Id, "docx"), default);
        var pdf = await handler.Handle(new(run.Id, "pdf"), default);

        var docxVersions = await db.ComparisonReportArtifacts
            .Where(x => x.ComparisonRunId == run.Id && x.Format == "docx")
            .OrderBy(x => x.Version).Select(x => x.Version).ToArrayAsync();
        Assert.Equal(new[] { 1, 2 }, docxVersions);
        Assert.Single(await db.ComparisonReportArtifacts
            .Where(x => x.ComparisonRunId == run.Id && x.Format == "pdf").ToListAsync());
        Assert.EndsWith("-v1.docx", first!.FileName);
        Assert.EndsWith("-v2.docx", second!.FileName);
        Assert.EndsWith("-v1.pdf", pdf!.FileName);
    }

    private static async Task<SteelSeed> SeedSteelScenario(NegareshDbContext db)
    {
        var organizationId = Guid.NewGuid();
        AddSettings(db, organizationId);
        var group = new DocumentGroup { OrganizationId = organizationId, Name = "فولاد",
            PassingThreshold = 80m, CreatedByUserId = "admin" };
        var target = new Document { OrganizationId = organizationId,
            Title = "امیدنامه فولاد دهدشت", DocumentType = "prospectus", OwnerUserId = "expert" };
        var targetVersion = new DocumentVersion { Document = target, DocumentId = target.Id,
            VersionNumber = 1, FileId = "target", ExtractedText = "نام شرکت فولاد دهدشت و سرمایه ثبت‌شده",
            LifecycleStatus = DocumentVersionLifecycleStatus.Extracted };
        target.Versions.Add(targetVersion);
        var golden = new Document { OrganizationId = organizationId,
            Title = "امیدنامه طلایی فولاد", DocumentType = "prospectus" };
        var goldenFinal = new DocumentVersion { Document = golden, DocumentId = golden.Id,
            VersionNumber = 1, FileId = "golden-final",
            ExtractedText = "نام شرکت فولاد و بند محرمانگی اطلاعات سهامداران",
            LifecycleStatus = DocumentVersionLifecycleStatus.Final, IsRagPublished = true };
        var goldenDraft = new DocumentVersion { Document = golden, DocumentId = golden.Id,
            VersionNumber = 2, FileId = "golden-draft", ExtractedText = "نسخه غیرنهایی",
            LifecycleStatus = DocumentVersionLifecycleStatus.Extracted };
        golden.Versions.AddRange([goldenFinal, goldenDraft]);
        var normal = new ComplianceCriterion { OrganizationId = organizationId, Code = "STEEL-NAME",
            Title = "نام شرکت", DefaultWeight = 90m, CreatedByUserId = "admin" };
        var critical = new ComplianceCriterion { OrganizationId = organizationId, Code = "STEEL-SECRET",
            Title = "محرمانگی", DefaultWeight = 10m, IsCriticalByDefault = true, CreatedByUserId = "admin" };
        var rules = new RuleSet { OrganizationId = organizationId, DocumentGroupId = group.Id,
            Name = "قواعد امیدنامه فولاد", EffectiveFromUtc = DateTime.UtcNow.AddDays(-1), CreatedByUserId = "admin",
            Rules = [Rule("STEEL-NAME", "نام شرکت", "نام شرکت"),
                Rule("STEEL-SECRET", "محرمانگی", "محرمانگی")] };
        db.AddRange(group, target, golden, normal, critical,
            new DocumentGroupMember { DocumentGroupId = group.Id, DocumentId = target.Id },
            new DocumentGroupMember { DocumentGroupId = group.Id, DocumentId = golden.Id },
            new DocumentGroupCriterion { DocumentGroupId = group.Id,
                ComplianceCriterionId = normal.Id, Weight = 90m, Order = 1 },
            new DocumentGroupCriterion { DocumentGroupId = group.Id,
                ComplianceCriterionId = critical.Id, Weight = 10m, IsCritical = true, Order = 2 },
            new GoldenDocument { OrganizationId = organizationId, DocumentGroupId = group.Id,
                DocumentId = golden.Id, Priority = 1, CreatedByUserId = "admin" }, rules);
        await db.SaveChangesAsync();
        return new(organizationId, group.Id, target.Id, targetVersion.Id,
            goldenFinal.Id, goldenDraft.Id);
    }

    private static Rule Rule(string code, string title, string required) => new()
    {
        Code = code, Title = title, Instruction = $"{title} الزامی است", IsActive = true,
        Parameters = [new RuleParameter { Key = "requiredTerm",
            ValueJson = JsonSerializer.Serialize(required) }]
    };

    private static void AddSettings(NegareshDbContext db, Guid organizationId) =>
        db.RuntimeSettings.AddRange(
            new RuntimeSetting { OrganizationId = organizationId, Category = "ai",
                Key = "embedding.model", ValueJson = "{\"modelId\":\"BAAI/bge-m3\"}" },
            new RuntimeSetting { OrganizationId = organizationId, Category = "ai",
                Key = "comparison.prompt", ValueJson = "{\"template\":\"evidence only\"}" });

    private static NegareshDbContext CreateDb() => new(
        new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed record Tenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed record SteelSeed(Guid OrganizationId, Guid GroupId,
        Guid TargetDocumentId, Guid TargetVersionId,
        Guid GoldenFinalVersionId, Guid GoldenDraftVersionId);
    private sealed class NullAudit : IAuditWriter
    { public void Add(string action, string entityType, string? entityId, object? metadata = null) { } }
    private sealed class RecordingAi : IAiDocumentProcessor
    {
        public int PublishCount { get; private set; }
        public Task<AiProcessingResult> ProcessAsync(Guid organizationId, Guid documentId,
            Guid versionId, string fileName, byte[] content, string embeddingModel,
            string accessScope, IReadOnlyCollection<string> allowedUserIds,
            IReadOnlyCollection<string> allowedGroupIds, bool publishToRag,
            CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<int> PublishTextAsync(Guid organizationId, Guid documentId, Guid versionId,
            string extractedText, string embeddingModel, string accessScope,
            IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds,
            CancellationToken cancellationToken) { PublishCount++; return Task.FromResult(1); }
        public Task DeleteVersionAsync(Guid organizationId, Guid documentId, Guid versionId,
            string embeddingModel, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<IReadOnlyList<AiRagSearchResult>> SearchAsync(Guid organizationId,
            string userId, IReadOnlyCollection<string> groupIds, string query,
            IReadOnlyCollection<Guid> documentIds, string embeddingModel, int limit,
            CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<AiRagSearchResult>>([]);
    }
    private sealed class StubReportGenerator : IComparisonReportGenerator
    {
        public Task<byte[]> GenerateAsync(ComparisonRun run, string format,
            CancellationToken cancellationToken) => Task.FromResult(
                System.Text.Encoding.UTF8.GetBytes($"{format}:{run.Id}"));
    }
}

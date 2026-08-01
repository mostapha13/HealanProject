using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Contracts.Generation;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class ContractConversationLifecycleTests
{
    [Fact]
    public async Task Correction_creates_immutable_next_draft_from_highest_final_reference()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var handler = new StartContractConversationHandler(db, seed.Tenant, files,
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی نرم‌افزار",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(first);
        Assert.Single(first.Drafts);
        Assert.Equal(seed.FinalVersionId, first.Drafts[0].BaseDocumentVersionId);
        Assert.Contains("Final", first.Drafts[0].SourceSnapshotJson);

        var second = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "بند آموزش کاربران توسط پیمانکار اضافه کن"), default);

        Assert.NotNull(second);
        Assert.Equal(2, second.Drafts.Count);
        Assert.Equal(2, second.Drafts[0].VersionNumber);
        Assert.NotEqual(second.Drafts[0].Id, second.Drafts[1].Id);
        Assert.Equal(1, second.Drafts[1].VersionNumber);
    }

    [Fact]
    public async Task Rag_publication_happens_only_after_requester_expert_and_manager_approvals()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var files = new MemoryFiles();
        var starter = new StartContractConversationHandler(db, seed.Tenant, files,
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());
        var conversation = (await starter.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default))!;
        var ai = new RecordingAi();
        var review = new ReviewContractDraftHandler(db, seed.Tenant, new NullAudit(), files,
            new HttpContextAccessor(), ai);
        var draftId = conversation.Drafts[0].Id;

        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.RequesterReview,
            new(true, null)), default);
        await review.Handle(new(conversation.Id, draftId, ContractDraftApprovalStatus.ExpertReview,
            new(true, null)), default);
        Assert.Equal(0, ai.PublishCount);

        var final = await review.Handle(new(conversation.Id, draftId,
            ContractDraftApprovalStatus.ManagerReview, new(true, "نهایی")), default);

        Assert.NotNull(final);
        Assert.Equal(1, ai.PublishCount);
        Assert.Equal(ContractDraftApprovalStatus.Final, final.Drafts[0].ApprovalStatus);
        Assert.NotNull(final.Drafts[0].FinalDocumentVersionId);
        Assert.Equal(1, ai.DeleteCount);
        Assert.Equal(DocumentVersionLifecycleStatus.Final,
            await db.DocumentVersions.Where(x => x.Id == final.Drafts[0].FinalDocumentVersionId)
                .Select(x => x.LifecycleStatus).SingleAsync());
    }

    [Fact]
    public async Task Greenfield_generation_snapshots_approved_group_clause_catalog()
    {
        await using var db = CreateDb();
        var seed = Seed(db, includeBase: false);
        db.ApprovedContractClauses.Add(new ApprovedContractClause
        {
            OrganizationId = seed.Tenant.OrganizationId, ContractGroupId = seed.GroupId,
            Code = "DISPUTE-01", Title = "حل اختلاف", Text = "مرجع حل اختلاف شورای سازمان است.",
            Order = 1, IsRequired = true, CreatedByUserId = seed.Tenant.UserId
        });
        await db.SaveChangesAsync();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit());

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "نگهداری ماشین‌آلات",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۶۵۰۰۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(result);
        Assert.Single(result.Drafts);
        Assert.Null(result.BaseContractId);
        Assert.Contains("DISPUTE-01", result.Drafts[0].SourceSnapshotJson);
        Assert.False(string.IsNullOrWhiteSpace(result.Drafts[0].GeneratedPdfFileId));
    }

    [Fact]
    public async Task Fasa_renewal_resolves_amount_conflict_and_snapshots_final_rag_citation()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var ai = new RecordingAi
        {
            SearchResults = [new AiRagSearchResult("مبلغ و شرایط قرارداد پشتیبانی فسا",
                .97, new AiRagCitation(seed.DocumentId, seed.FinalVersionId, 4, "مبلغ قرارداد"))]
        };
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی شرکت فسا",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۲۵ درصد افزایش و مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد")), default);

        Assert.NotNull(first);
        Assert.Empty(first.Drafts);
        Assert.Contains(first.Clarifications, x => !x.IsAnswered && x.Question.Contains("متفاوت است"));

        var resolved = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "مبلغ قطعی اعلام‌شده مبنا باشد"), default);

        Assert.NotNull(resolved);
        Assert.Single(resolved.Drafts);
        Assert.Contains(seed.FinalVersionId.ToString(), resolved.Drafts[0].SourceSnapshotJson);
        Assert.Contains("\"Page\":4", resolved.Drafts[0].SourceSnapshotJson);
        Assert.False(string.IsNullOrWhiteSpace(resolved.Drafts[0].GeneratedPdfFileId));
        Assert.Equal(1, ai.SearchCount);
    }

    [Fact]
    public async Task Dispute_clause_conflict_requires_explicit_replacement_decision()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        await db.SaveChangesAsync();
        var ai = new RecordingAi
        {
            SearchResults = [new AiRagSearchResult(
                "حل اختلاف قرارداد قبلی از طریق داوری انجام می‌شود.", .92,
                new AiRagCitation(seed.DocumentId, seed.FinalVersionId, 7, "حل اختلاف"))]
        };
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var first = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد و بند حل اختلاف شورای سازمان را اضافه کن")), default);

        Assert.NotNull(first);
        Assert.Empty(first.Drafts);
        Assert.Contains(first.Clarifications, x => x.Key.Contains("DISPUTE_CONFLICT"));

        var resolved = await handler.Handle(new SendContractConversationMessageCommand(first.Id,
            "بند جدید جایگزین بند قبلی شود"), default);

        Assert.NotNull(resolved);
        Assert.Single(resolved.Drafts);
        Assert.Contains("DISPUTE_CONFLICT", resolved.Drafts[0].ConflictAnalysisJson);
    }

    [Fact]
    public async Task Cross_group_rag_source_is_used_only_when_explicitly_selected()
    {
        await using var db = CreateDb();
        var seed = Seed(db);
        var otherGroup = new ContractGroup { OrganizationId = seed.Tenant.OrganizationId,
            Name = "نگهداری", CreatedByUserId = seed.Tenant.UserId };
        var otherDocument = new Document { OrganizationId = seed.Tenant.OrganizationId,
            Title = "قرارداد نگهداری مرجع", DocumentType = "Contract" };
        otherDocument.Versions.Add(new DocumentVersion { DocumentId = otherDocument.Id,
            VersionNumber = 1, FileId = "other", LifecycleStatus = DocumentVersionLifecycleStatus.Final,
            IsRagPublished = true, ExtractedText = "شرایط نگهداری" });
        var otherContract = new Contract { OrganizationId = seed.Tenant.OrganizationId,
            Document = otherDocument, Subject = "نگهداری", PrimaryContractGroup = otherGroup,
            StartDate = new DateOnly(2025, 3, 21), EndDate = new DateOnly(2026, 3, 20) };
        otherContract.GroupMemberships.Add(new ContractGroupMembership
            { ContractGroup = otherGroup, IsPrimary = true });
        db.Contracts.Add(otherContract);
        await db.SaveChangesAsync();
        var ai = new RecordingAi();
        var handler = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), ai);

        var result = await handler.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد",
            [otherContract.Id])), default);

        Assert.NotNull(result);
        Assert.Contains(otherDocument.Id, ai.LastDocumentIds);
        Assert.Contains(otherContract.Id.ToString(), result.Drafts[0].SourceSnapshotJson);

        var denied = new StartContractConversationHandler(db, seed.Tenant, new MemoryFiles(),
            new PassThroughGenerator(), new HttpContextAccessor(), new NullAudit(), null,
            new SelectiveAuthorizer(seed.GroupId));
        var deniedResult = await denied.Handle(new StartContractConversationCommand(new(
            seed.PartyId, seed.GroupId, 1405, "پشتیبانی دوم",
            "از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ مبلغ ۱۳۰۰۰۰۰۰۰ ریال باشد",
            [otherContract.Id])), default);
        Assert.Null(deniedResult);
    }

    private static SeedResult Seed(NegareshDbContext db, bool includeBase = true)
    {
        var organizationId = Guid.NewGuid();
        var tenant = new StubTenant(organizationId, "user-1");
        var party = new OrganizationParty { OrganizationId = organizationId, Name = "شرکت فسا" };
        var group = new ContractGroup { OrganizationId = organizationId, Name = "پشتیبانی", CreatedByUserId = tenant.UserId };
        var document = new Document { OrganizationId = organizationId, Title = "قرارداد ۱۴۰۴", DocumentType = "Contract" };
        var final = new DocumentVersion { DocumentId = document.Id, VersionNumber = 3,
            FileId = "base-final", LifecycleStatus = DocumentVersionLifecycleStatus.Final,
            IsRagPublished = true, ExtractedText = "حل اختلاف قرارداد قبلی از طریق داوری انجام می‌شود." };
        document.Versions.Add(final);
        var contract = new Contract
        {
            OrganizationId = organizationId, Document = document, Subject = "پشتیبانی",
            Amount = 100_000_000m, StartDate = new DateOnly(2025, 3, 21),
            EndDate = new DateOnly(2026, 3, 20), PrimaryContractGroup = group
        };
        contract.Parties.Add(new ContractParty { DirectoryParty = party, Name = party.Name, Role = ContractPartyRole.SecondParty });
        contract.GroupMemberships.Add(new ContractGroupMembership { ContractGroup = group, IsPrimary = true });
        db.ContractTemplates.Add(new ContractTemplate
        {
            OrganizationId = organizationId, ContractGroup = group, ContractYear = 1405,
            Name = "قالب پشتیبانی", ContractType = "service", FileId = "template", Version = 2
        });
        db.RuntimeSettings.Add(new RuntimeSetting { OrganizationId = organizationId, Category = "ai", Key = "embedding.model", ValueJson = "{\"modelId\":\"BAAI/bge-m3\"}" });
        if (includeBase) db.Contracts.Add(contract);
        else
        {
            db.OrganizationParties.Add(party);
            db.ContractGroups.Add(group);
        }
        return new(tenant, party.Id, group.Id, document.Id, final.Id);
    }

    private static NegareshDbContext CreateDb() => new(new DbContextOptionsBuilder<NegareshDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private sealed record SeedResult(StubTenant Tenant, Guid PartyId, Guid GroupId,
        Guid DocumentId, Guid FinalVersionId);
    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed class SelectiveAuthorizer(Guid allowedGroupId) : IDataScopeAuthorizer
    {
        public Task<bool> CanAccessAsync(DataScopeResourceType resourceType, Guid resourceId,
            CancellationToken cancellationToken = default) => Task.FromResult(resourceId == allowedGroupId);
        public Task<IReadOnlySet<Guid>?> GetAllowedResourceIdsAsync(DataScopeResourceType resourceType,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlySet<Guid>?>(new HashSet<Guid> { allowedGroupId });
    }
    private sealed class NullAudit : IAuditWriter { public void Add(string action, string entityType, string? entityId, object? metadata = null) { } }
    private sealed class PassThroughGenerator : IContractDocumentGenerator
    {
        public Task<byte[]> GenerateAsync(byte[] template, IReadOnlyDictionary<string, string> values, CancellationToken ct) => Task.FromResult<byte[]>([1, 2, 3]);
        public Task<byte[]> GeneratePdfAsync(ContractPdfRequest request, CancellationToken ct) =>
            Task.FromResult<byte[]>([0x25, 0x50, 0x44, 0x46]);
    }
    private sealed class MemoryFiles : IFileManagerClient
    {
        private int count;
        public Task<string> UploadAsync(Stream content, string fileName, string contentType, string? bearerToken, CancellationToken ct) => Task.FromResult($"generated-{++count}");
        public Task<FileManagerDownload> DownloadAsync(string fileId, string? bearerToken, CancellationToken ct) => Task.FromResult(new FileManagerDownload([1, 2, 3], $"{fileId}.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }
    private sealed class RecordingAi : IAiDocumentProcessor
    {
        public int PublishCount { get; private set; }
        public int SearchCount { get; private set; }
        public int DeleteCount { get; private set; }
        public IReadOnlyList<AiRagSearchResult> SearchResults { get; init; } = [];
        public IReadOnlyCollection<Guid> LastDocumentIds { get; private set; } = [];
        public Task<AiProcessingResult> ProcessAsync(Guid organizationId, Guid documentId, Guid versionId, string fileName, byte[] content, string embeddingModel, string accessScope, IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds, bool publishToRag, CancellationToken ct) => Task.FromResult(new AiProcessingResult("extracted", 1, 10, 0, 0, "متن نهایی"));
        public Task<int> PublishTextAsync(Guid organizationId, Guid documentId, Guid versionId, string extractedText, string embeddingModel, string accessScope, IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds, CancellationToken ct) { PublishCount++; return Task.FromResult(1); }
        public Task DeleteVersionAsync(Guid organizationId, Guid documentId, Guid versionId, string embeddingModel, CancellationToken ct)
        { DeleteCount++; return Task.CompletedTask; }
        public Task<IReadOnlyList<AiRagSearchResult>> SearchAsync(Guid organizationId,
            string userId, IReadOnlyCollection<string> groupIds, string query,
            IReadOnlyCollection<Guid> documentIds, string embeddingModel, int limit,
            CancellationToken ct)
        { SearchCount++; LastDocumentIds = documentIds; return Task.FromResult(SearchResults); }
    }
}

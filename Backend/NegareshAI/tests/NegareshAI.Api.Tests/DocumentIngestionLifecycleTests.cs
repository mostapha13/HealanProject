using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using System.Reflection;
using System.Text.Json;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class DocumentIngestionLifecycleTests
{
    [Fact]
    public void Suggested_fields_include_contract_year_company_amount_and_clause()
    {
        var support = typeof(UploadDocumentBatchCommand).Assembly.GetType(
            "NegareshAI.Api.Application.Documents.Commands.DocumentIngestionSupport", true)!;
        var method = support.GetMethod("SuggestFields",
            BindingFlags.Public | BindingFlags.Static)!;
        var value = Assert.IsType<string>(method.Invoke(null,
            ["قرارداد شماره 1405/12 شرکت عمران ماشین مبلغ 265,000,000,000 ریال\nماده 1 موضوع قرارداد"]));
        using var json = JsonDocument.Parse(value);

        Assert.Contains("1405", json.RootElement.GetProperty("years")
            .EnumerateArray().Select(x => x.GetString()));
        Assert.NotEmpty(json.RootElement.GetProperty("companyAndPartyCandidates").EnumerateArray());
        Assert.NotEmpty(json.RootElement.GetProperty("amounts").EnumerateArray());
        Assert.NotEmpty(json.RootElement.GetProperty("clauseHeadings").EnumerateArray());
    }

    [Fact]
    public async Task Extracted_version_is_not_published_before_both_approvals()
    {
        await using var db = CreateDb();
        var organizationId = Guid.NewGuid();
        var tenant = new StubTenant(organizationId, "expert-1");
        var version = Seed(db, organizationId, DocumentVersionLifecycleStatus.Extracted);
        await db.SaveChangesAsync();
        var ai = new RecordingAi();

        var expert = new ExpertReviewDocumentVersionCommandHandler(db, tenant, new NullAudit());
        var expertResult = await expert.Handle(new(
            version.DocumentId, version.Id, true, "بررسی شد"), default);

        Assert.NotNull(expertResult);
        Assert.Equal(DocumentVersionLifecycleStatus.ManagerReview, version.LifecycleStatus);
        Assert.Equal(0, ai.PublishCount);

        var manager = new ManagerReviewDocumentVersionCommandHandler(
            db, new StubTenant(organizationId, "manager-1"), ai, new NullAudit());
        var managerResult = await manager.Handle(new(
            version.DocumentId, version.Id, true, "نهایی"), default);

        Assert.NotNull(managerResult);
        Assert.Equal(1, ai.PublishCount);
        Assert.True(version.IsRagPublished);
        Assert.Equal(DocumentVersionLifecycleStatus.Final, version.LifecycleStatus);
    }

    [Fact]
    public async Task Manager_cannot_publish_version_before_expert_approval()
    {
        await using var db = CreateDb();
        var organizationId = Guid.NewGuid();
        var version = Seed(db, organizationId, DocumentVersionLifecycleStatus.Extracted);
        await db.SaveChangesAsync();
        var ai = new RecordingAi();
        var handler = new ManagerReviewDocumentVersionCommandHandler(
            db, new StubTenant(organizationId, "manager-1"), ai, new NullAudit());

        var result = await handler.Handle(new(
            version.DocumentId, version.Id, true, null), default);

        Assert.Null(result);
        Assert.Equal(0, ai.PublishCount);
        Assert.False(version.IsRagPublished);
    }

    [Fact]
    public async Task Finalizing_new_version_unpublishes_previous_final_version()
    {
        await using var db = CreateDb();
        var organizationId = Guid.NewGuid();
        var previous = Seed(db, organizationId, DocumentVersionLifecycleStatus.Final);
        previous.IsRagPublished = true;
        var next = new DocumentVersion
        {
            DocumentId = previous.DocumentId, VersionNumber = 2, FileId = "new",
            ExtractedText = "متن نهایی جدید", LifecycleStatus = DocumentVersionLifecycleStatus.ManagerReview
        };
        previous.Document!.Versions.Add(next);
        await db.SaveChangesAsync();
        var ai = new RecordingAi();
        var handler = new ManagerReviewDocumentVersionCommandHandler(
            db, new StubTenant(organizationId, "manager-1"), ai, new NullAudit());

        await handler.Handle(new(next.DocumentId, next.Id, true, null), default);

        Assert.Equal(1, ai.PublishCount);
        Assert.Equal(1, ai.DeleteCount);
        Assert.Equal(DocumentVersionLifecycleStatus.Superseded, previous.LifecycleStatus);
        Assert.False(previous.IsRagPublished);
        Assert.True(next.IsRagPublished);
    }

    private static DocumentVersion Seed(
        NegareshDbContext db, Guid organizationId, DocumentVersionLifecycleStatus status)
    {
        db.RuntimeSettings.Add(new RuntimeSetting
        {
            OrganizationId = organizationId, Category = "ai", Key = "embedding.model",
            ValueJson = """{"modelId":"BAAI/bge-m3"}""", IsActive = true
        });
        var document = new Document
        {
            OrganizationId = organizationId, OwnerUserId = "owner-1",
            Title = "سند", DocumentType = "contract"
        };
        var version = new DocumentVersion
        {
            DocumentId = document.Id, VersionNumber = 1, FileId = "file",
            ExtractedText = "متن استخراج شده", LifecycleStatus = status,
            Document = document
        };
        document.Versions.Add(version);
        db.Documents.Add(document);
        return version;
    }

    private static NegareshDbContext CreateDb() => new(
        new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed class NullAudit : IAuditWriter
    {
        public void Add(string action, string entityType, string? entityId, object? metadata = null) { }
    }

    private sealed class RecordingAi : IAiDocumentProcessor
    {
        public int PublishCount { get; private set; }
        public int DeleteCount { get; private set; }
        public Task<AiProcessingResult> ProcessAsync(Guid organizationId, Guid documentId,
            Guid versionId, string fileName, byte[] content, string embeddingModel,
            string accessScope, IReadOnlyCollection<string> allowedUserIds,
            IReadOnlyCollection<string> allowedGroupIds, bool publishToRag,
            CancellationToken cancellationToken) =>
            Task.FromResult(new AiProcessingResult("extracted", 1, 10, 0, 0, "text"));
        public Task<int> PublishTextAsync(Guid organizationId, Guid documentId,
            Guid versionId, string extractedText, string embeddingModel, string accessScope,
            IReadOnlyCollection<string> allowedUserIds, IReadOnlyCollection<string> allowedGroupIds,
            CancellationToken cancellationToken)
        { PublishCount++; return Task.FromResult(1); }
        public Task DeleteVersionAsync(Guid organizationId, Guid documentId, Guid versionId,
            string embeddingModel, CancellationToken cancellationToken)
        { DeleteCount++; return Task.CompletedTask; }
        public Task<IReadOnlyList<AiRagSearchResult>> SearchAsync(Guid organizationId,
            string userId, IReadOnlyCollection<string> groupIds, string query,
            IReadOnlyCollection<Guid> documentIds, string embeddingModel, int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<AiRagSearchResult>>([]);
    }
}

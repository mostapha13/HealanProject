using AutoMapper;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Mappings;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Documents.Commands;
using NegareshAI.Api.Application.Documents.Queries;
using NegareshAI.Api.Application.Settings.Commands;
using NegareshAI.Api.Application.Settings.Queries;
using NegareshAI.Api.Application.Contracts.Commands;
using NegareshAI.Api.Application.Contracts.Queries;
using NegareshAI.Api.Application.Knowledge;
using NegareshAI.Api.Application.Comparisons;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using NegareshAI.Api.Services;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class TenantIsolationTests
{
    [Fact]
    public void Current_tenant_fails_closed_outside_development_without_organization_claim()
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim("sub", "user-a")],
                    "test"))
            }
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Tenancy:DevelopmentOrganizationId"] = KnownOrganizations.Development.ToString()
            })
            .Build();
        var tenant = new CurrentTenant(
            accessor,
            configuration,
            new StubHostEnvironment(Environments.Production));

        Assert.Throws<TenantResolutionException>(() => tenant.OrganizationId);
    }

    [Fact]
    public async Task Get_document_does_not_return_another_tenants_document()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var foreignDocument = CreateDocument(organizationB, "foreign-file");
        var ownDocument = CreateDocument(organizationA, "own-file");
        db.Documents.AddRange(foreignDocument, ownDocument);
        await db.SaveChangesAsync();

        var audit = new RecordingAuditWriter();
        var handler = new GetDocumentQueryHandler(
            db,
            CreateMapper(),
            new StubTenant(organizationA, "user-a"),
            audit);

        Assert.Null(await handler.Handle(new GetDocumentQuery(foreignDocument.Id), default));

        var ownResponse = await handler.Handle(new GetDocumentQuery(ownDocument.Id), default);
        Assert.NotNull(ownResponse);
        Assert.Equal(organizationA, ownResponse.OrganizationId);
        Assert.Equal("own-file", ownResponse.FileId);
        Assert.Single(audit.Entries);
    }

    [Fact]
    public async Task Register_document_uses_server_tenant_and_writes_audit()
    {
        var organizationId = Guid.NewGuid();
        await using var db = CreateDbContext();
        db.Organizations.Add(new Organization { Id = organizationId, Name = "Tenant A" });
        await db.SaveChangesAsync();

        var audit = new RecordingAuditWriter();
        var handler = new RegisterDocumentCommandHandler(
            db,
            CreateMapper(),
            new StubTenant(organizationId, "user-a"),
            audit);

        var response = await handler.Handle(
            new RegisterDocumentCommand(
                "Contract A",
                "contract",
                "file-a",
                ConfidentialityLevel.HighlyConfidential),
            default);

        Assert.Equal(organizationId, response.OrganizationId);
        Assert.Equal(ConfidentialityLevel.HighlyConfidential, response.ConfidentialityLevel);
        Assert.Equal("file-a", response.FileId);
        Assert.True(await db.OrganizationMemberships.AnyAsync(item =>
            item.OrganizationId == organizationId && item.UserId == "user-a"));
        Assert.Single(audit.Entries);
    }

    [Fact]
    public async Task Delete_document_soft_deletes_only_the_current_tenants_document()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var foreignDocument = CreateDocument(organizationB, "foreign-file");
        var ownDocument = CreateDocument(organizationA, "own-file");
        db.Documents.AddRange(foreignDocument, ownDocument);
        await db.SaveChangesAsync();

        var audit = new RecordingAuditWriter();
        var handler = new DeleteDocumentCommandHandler(
            db,
            new StubTenant(organizationA, "user-a"),
            audit);

        Assert.False(await handler.Handle(new DeleteDocumentCommand(foreignDocument.Id), default));
        Assert.True(await handler.Handle(new DeleteDocumentCommand(ownDocument.Id), default));
        Assert.Null(await db.Documents.SingleOrDefaultAsync(item => item.Id == ownDocument.Id));
        Assert.NotNull(await db.Documents.IgnoreQueryFilters()
            .SingleOrDefaultAsync(item => item.Id == ownDocument.Id && item.IsDeleted));
        Assert.False((await db.Documents.IgnoreQueryFilters()
            .SingleAsync(item => item.Id == foreignDocument.Id)).IsDeleted);
        Assert.Single(audit.Entries);
    }

    [Fact]
    public async Task List_and_update_are_scoped_to_the_current_tenant()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var ownDocument = CreateDocument(organizationA, "own-file");
        ownDocument.Title = "Own searchable contract";
        var foreignDocument = CreateDocument(organizationB, "foreign-file");
        foreignDocument.Title = "Foreign searchable contract";
        db.Documents.AddRange(ownDocument, foreignDocument);
        await db.SaveChangesAsync();

        var tenant = new StubTenant(organizationA, "user-a");
        var listHandler = new ListDocumentsQueryHandler(db, tenant);
        var list = await listHandler.Handle(
            new ListDocumentsQuery("searchable", null, null),
            default);

        Assert.Equal(1, list.TotalCount);
        Assert.Equal(ownDocument.Id, Assert.Single(list.Items).Id);

        var audit = new RecordingAuditWriter();
        var updateHandler = new UpdateDocumentCommandHandler(
            db,
            tenant,
            audit,
            CreateMapper());
        Assert.Null(await updateHandler.Handle(
            new UpdateDocumentCommand(
                foreignDocument.Id,
                "Hacked",
                "contract",
                ConfidentialityLevel.Internal),
            default));

        var updated = await updateHandler.Handle(
            new UpdateDocumentCommand(
                ownDocument.Id,
                "Updated title",
                "prospectus",
                ConfidentialityLevel.HighlyConfidential),
            default);
        Assert.NotNull(updated);
        Assert.Equal("Updated title", updated.Title);
        Assert.Equal(ConfidentialityLevel.HighlyConfidential, updated.ConfidentialityLevel);
        Assert.Equal("Foreign searchable contract", foreignDocument.Title);
        Assert.Single(audit.Entries);
    }

    [Fact]
    public async Task Runtime_settings_are_versioned_and_tenant_scoped()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var audit = new RecordingAuditWriter();
        var tenantA = new StubTenant(organizationA, "user-a");
        var upsert = new UpsertRuntimeSettingCommandHandler(db, tenantA, audit);

        var created = await upsert.Handle(
            new UpsertRuntimeSettingCommand(
                "ai-model", "document-comparison", """{"model":"local-a"}""", true),
            default);
        var updated = await upsert.Handle(
            new UpsertRuntimeSettingCommand(
                "ai-model", "document-comparison", """{"model":"local-b"}""", true),
            default);

        db.RuntimeSettings.Add(new RuntimeSetting
        {
            OrganizationId = organizationB,
            Category = "ai-model",
            Key = "document-comparison",
            ValueJson = """{"model":"foreign"}"""
        });
        await db.SaveChangesAsync();

        var list = await new ListRuntimeSettingsQueryHandler(db, tenantA)
            .Handle(new ListRuntimeSettingsQuery("ai-model"), default);

        Assert.Equal(created.Id, updated.Id);
        Assert.Equal(2, updated.Version);
        Assert.Equal("""{"model":"local-b"}""", Assert.Single(list).ValueJson);
        Assert.Equal(2, audit.Entries.Count);
    }

    [Fact]
    public async Task Contract_crud_is_scoped_to_the_document_organization()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var ownDocument = CreateDocument(organizationA, "own-file");
        var foreignDocument = CreateDocument(organizationB, "foreign-file");
        db.Documents.AddRange(ownDocument, foreignDocument);
        await db.SaveChangesAsync();
        var tenant = new StubTenant(organizationA, "user-a");
        var audit = new RecordingAuditWriter();
        var handler = new CreateContractCommandHandler(db, tenant, audit);
        var foreignRequest = ContractRequest(foreignDocument.Id, "Foreign");
        Assert.Null(await handler.Handle(
            new CreateContractCommand(foreignRequest), default));

        var created = await handler.Handle(
            new CreateContractCommand(ContractRequest(ownDocument.Id, "Own")),
            default);
        Assert.NotNull(created);
        Assert.Equal(organizationA,
            (await db.Contracts.SingleAsync(item => item.Id == created.Id)).OrganizationId);
        var listed = await new ListContractsQueryHandler(db, tenant).Handle(
            new ListContractsQuery(null, null), default);
        Assert.Equal(created.Id, Assert.Single(listed.Items).Id);
        Assert.Single(created.Parties);
        Assert.Single(audit.Entries);
    }

    [Fact]
    public async Task Restore_document_only_restores_current_tenants_archive()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var own = CreateDocument(organizationA, "own");
        var foreign = CreateDocument(organizationB, "foreign");
        own.IsDeleted = true;
        foreign.IsDeleted = true;
        db.Documents.AddRange(own, foreign);
        await db.SaveChangesAsync();
        var handler = new RestoreDocumentCommandHandler(
            db, new StubTenant(organizationA, "user-a"), new RecordingAuditWriter());

        Assert.False(await handler.Handle(new RestoreDocumentCommand(foreign.Id), default));
        Assert.True(await handler.Handle(new RestoreDocumentCommand(own.Id), default));
        Assert.False((await db.Documents.IgnoreQueryFilters()
            .SingleAsync(item => item.Id == own.Id)).IsDeleted);
        Assert.True((await db.Documents.IgnoreQueryFilters()
            .SingleAsync(item => item.Id == foreign.Id)).IsDeleted);
    }

    [Fact]
    public async Task Knowledge_groups_and_versioned_rules_are_tenant_scoped()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var ownDocument = CreateDocument(organizationA, "own");
        var foreignDocument = CreateDocument(organizationB, "foreign");
        db.Documents.AddRange(ownDocument, foreignDocument);
        await db.SaveChangesAsync();
        var tenant = new StubTenant(organizationA, "user-a");
        var audit = new RecordingAuditWriter();
        var groupHandler = new CreateDocumentGroupCommandHandler(db, tenant, audit);

        Assert.Null(await groupHandler.Handle(new CreateDocumentGroupCommand(
            new CreateDocumentGroupRequest(
                "Invalid", null, [ownDocument.Id, foreignDocument.Id])), default));

        var group = await groupHandler.Handle(new CreateDocumentGroupCommand(
            new CreateDocumentGroupRequest(
                "فولادی", "اسناد مبنای فولاد", [ownDocument.Id])), default);
        Assert.NotNull(group);
        Assert.Equal(ownDocument.Id, Assert.Single(group.DocumentIds));

        var ruleHandler = new CreateRuleSetCommandHandler(db, tenant, audit);
        var request = new CreateRuleSetRequest(
            "کنترل فنی فولاد", group.Id, DateTime.UtcNow, null,
            [new CreateRuleRequest(
                "STEEL-GRADE", "گرید فولاد", "گرید الزام‌شده را بررسی کن",
                4, 1, [new CreateRuleParameterRequest("grade", """{"value":"ST37"}""")])]);
        var versionOne = await ruleHandler.Handle(
            new CreateRuleSetCommand(request), default);
        var versionTwo = await ruleHandler.Handle(
            new CreateRuleSetCommand(request), default);

        Assert.NotNull(versionOne);
        Assert.NotNull(versionTwo);
        Assert.Equal(1, versionOne.Version);
        Assert.Equal(2, versionTwo.Version);
        Assert.Equal("ST37", JsonDocument.Parse(
            Assert.Single(Assert.Single(versionTwo.Rules).Parameters).ValueJson)
            .RootElement.GetProperty("value").GetString());

        db.DocumentGroups.Add(new DocumentGroup
        {
            OrganizationId = organizationB,
            Name = "Foreign",
            CreatedByUserId = "user-b"
        });
        await db.SaveChangesAsync();
        var listedGroups = await new ListDocumentGroupsQueryHandler(db, tenant)
            .Handle(new ListDocumentGroupsQuery(), default);
        var listedRuleSets = await new ListRuleSetsQueryHandler(db, tenant)
            .Handle(new ListRuleSetsQuery(group.Id), default);

        Assert.Equal(group.Id, Assert.Single(listedGroups).Id);
        Assert.Equal(2, listedRuleSets.Count);
        Assert.Equal(3, audit.Entries.Count);
    }

    [Fact]
    public async Task Combined_comparison_is_reproducible_and_findings_are_reviewable()
    {
        var organizationId = Guid.NewGuid();
        await using var db = CreateDbContext();
        var target = CreateDocument(organizationId, "target");
        target.Title = "امیدنامه فولاد دهدشت";
        target.Versions[0].ExtractedText =
            "معرفی شرکت و موضوع فعالیت\fسرمایه ثبت شده 15000000000 ریال است.";
        var reference = CreateDocument(organizationId, "reference");
        reference.Title = "امیدنامه شرکت B";
        reference.Versions[0].ExtractedText =
            "معرفی شرکت و موضوع فعالیت\fسرمایه ثبت شده 15000000000 ریال است. محرمانگی";
        var group = new DocumentGroup
        {
            OrganizationId = organizationId,
            Name = "فولادی",
            Members = [new DocumentGroupMember { DocumentId = reference.Id }]
        };
        var ruleSet = new RuleSet
        {
            OrganizationId = organizationId,
            DocumentGroupId = group.Id,
            Name = "کنترل امیدنامه فولادی",
            Rules =
            [
                new Rule
                {
                    Code = "CAPITAL", Title = "سرمایه ثبتی",
                    Instruction = "سرمایه را اصلاح کنید.", Severity = 5,
                    Parameters =
                    [
                        new RuleParameter
                        {
                            Key = "expectedNumber",
                            ValueJson = """{"value":"15000000000"}"""
                        }
                    ]
                },
                new Rule
                {
                    Code = "CONFIDENTIALITY", Title = "بند محرمانگی",
                    Instruction = "بند محرمانگی اضافه شود.", Severity = 3,
                    Parameters =
                    [
                        new RuleParameter
                        {
                            Key = "requiredTerm",
                            ValueJson = """{"value":"محرمانگی"}"""
                        }
                    ]
                }
            ]
        };
        db.AddRange(target, reference, group, ruleSet);
        db.RuntimeSettings.AddRange(
            new RuntimeSetting
            {
                OrganizationId = organizationId, Category = "ai",
                Key = "embedding.model", ValueJson = """{"modelId":"BAAI/bge-m3"}"""
            },
            new RuntimeSetting
            {
                OrganizationId = organizationId, Category = "ai",
                Key = "comparison.prompt", ValueJson = """{"template":"compare"}"""
            });
        await db.SaveChangesAsync();
        var tenant = new StubTenant(organizationId, "expert-a");
        var audit = new RecordingAuditWriter();
        var handler = new StartComparisonCommandHandler(
            db, tenant, new ComparisonEngine(), audit);

        var run = await handler.Handle(new StartComparisonCommand(
            new StartComparisonRequest(
                target.Id, target.Versions[0].Id, ComparisonBasisMode.Combined,
                group.Id, [ruleSet.Id], reference.Id, reference.Versions[0].Id,
                null)), default);

        Assert.NotNull(run);
        Assert.Equal("BAAI/bge-m3", run.ModelId);
        Assert.Equal("comparison.prompt:v1", run.PromptVersion);
        Assert.Contains(ruleSet.Id.ToString(), run.RuleSetSnapshotJson);
        Assert.Contains(reference.Versions[0].Id.ToString(), run.SourceSnapshotJson);
        Assert.Equal(3, run.Findings.Count);
        var missing = Assert.Single(run.Findings, item =>
            item.Type == FindingType.Missing && item.RuleId is not null);
        Assert.Equal(3, missing.Severity);
        Assert.Null(missing.TargetEvidence);

        var reviewed = await new ReviewFindingCommandHandler(db, tenant, audit)
            .Handle(new ReviewFindingCommand(missing.Id,
                new ReviewFindingRequest(
                    FindingReviewDecision.Corrected, "با واحد حقوقی بررسی شد.",
                    "بند محرمانگی در پیوست وجود دارد.")), default);
        Assert.NotNull(reviewed);
        Assert.Equal(FindingReviewDecision.Corrected, reviewed.ReviewDecision);
        Assert.Equal("expert-a", reviewed.ReviewedByUserId);
        Assert.Equal(2, audit.Entries.Count);
    }

    [Fact]
    public async Task Comparison_cannot_use_another_tenants_target_or_reference()
    {
        var organizationA = Guid.NewGuid();
        var organizationB = Guid.NewGuid();
        await using var db = CreateDbContext();
        var own = CreateDocument(organizationA, "own");
        own.Versions[0].ExtractedText = "متن سند خودی";
        var foreign = CreateDocument(organizationB, "foreign");
        foreign.Versions[0].ExtractedText = "متن سند خارجی";
        db.AddRange(own, foreign);
        db.RuntimeSettings.AddRange(
            new RuntimeSetting
            {
                OrganizationId = organizationA, Category = "ai",
                Key = "embedding.model", ValueJson = """{"modelId":"local"}"""
            },
            new RuntimeSetting
            {
                OrganizationId = organizationA, Category = "ai",
                Key = "comparison.prompt", ValueJson = """{"template":"compare"}"""
            });
        await db.SaveChangesAsync();
        var handler = new StartComparisonCommandHandler(
            db, new StubTenant(organizationA, "user-a"),
            new ComparisonEngine(), new RecordingAuditWriter());

        Assert.Null(await handler.Handle(new StartComparisonCommand(
            new StartComparisonRequest(
                foreign.Id, null, ComparisonBasisMode.ReferenceDocument,
                null, [], own.Id, null, null)), default));
        Assert.Null(await handler.Handle(new StartComparisonCommand(
            new StartComparisonRequest(
                own.Id, null, ComparisonBasisMode.ReferenceDocument,
                null, [], foreign.Id, null, null)), default));
        Assert.Empty(db.ComparisonRuns);
    }

    private static NegareshDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new NegareshDbContext(options);
    }

    private static IMapper CreateMapper() =>
        new MapperConfiguration(configuration =>
            configuration.AddProfile<DocumentMappingProfile>()).CreateMapper();

    private static Document CreateDocument(Guid organizationId, string fileId)
    {
        var document = new Document
        {
            OrganizationId = organizationId,
            Title = fileId,
            DocumentType = "contract"
        };
        document.Versions.Add(new DocumentVersion
        {
            DocumentId = document.Id,
            VersionNumber = 1,
            FileId = fileId
        });
        return document;
    }

    private static SaveContractRequest ContractRequest(Guid documentId, string subject) =>
        new(documentId, null, subject, ContractStatus.Draft, 1_000_000, "IRR",
            DateOnly.FromDateTime(DateTime.UtcNow),
            DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1)),
            "owner-a",
            [new ContractPartyRequest(
                ContractPartyRole.SecondParty, "Company A", null, null)]);

    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;

    private sealed class StubHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "NegareshAI.Api.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class RecordingAuditWriter : IAuditWriter
    {
        public List<string> Entries { get; } = [];

        public void Add(string action, string entityType, string? entityId, object? metadata = null) =>
            Entries.Add($"{action}:{entityType}:{entityId}");
    }
}

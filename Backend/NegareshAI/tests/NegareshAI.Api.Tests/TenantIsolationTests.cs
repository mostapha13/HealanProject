using AutoMapper;
using System.Security.Claims;
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
using NegareshAI.Api.Data;
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

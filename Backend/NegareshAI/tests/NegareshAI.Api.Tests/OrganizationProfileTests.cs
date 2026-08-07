using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.MasterData;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class OrganizationProfileTests
{
    [Fact]
    public async Task Save_profile_normalizes_identifiers_and_keeps_all_contract_fields()
    {
        var organizationId = Guid.NewGuid();
        await using var db = new NegareshDbContext(
            new DbContextOptionsBuilder<NegareshDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Organizations.Add(new Organization { Id = organizationId, Name = "نام قبلی" });
        await db.SaveChangesAsync();
        var handler = new OrganizationProfileHandler(db,
            new StubTenant(organizationId, "admin"), new NullAudit());

        var result = await handler.Handle(new SaveOrganizationProfileCommand(new(
            "شرکت داده پردازان", "مصطفی مهدوی", "ابراهیم", "۰۰۱-۲۳۴-۵۶۷۸",
            "۱۴۰۰۱۲۳۴۵۶۷", "۴۱۱۱۱۱۱۱۱۱۱۱", "تهران، خیابان نمونه", "۰۲۱-۸۸۷۷۶۶۵۵",
            "۱۲۳۴۵", "۱۴۳۳۶۷۸۹۰۱", null, "info@example.com", "https://example.com")), default);

        Assert.NotNull(result);
        Assert.Equal("0012345678", result.ChiefExecutiveNationalId);
        Assert.Equal("14001234567", result.NationalIdentifier);
        Assert.Equal("411111111111", result.EconomicCode);
        Assert.Equal("شرکت داده پردازان", result.Name);
        Assert.Equal("تهران، خیابان نمونه", result.Address);
        Assert.Equal("info@example.com", result.Email);

        var loaded = await handler.Handle(new GetOrganizationProfileQuery(), default);
        Assert.NotNull(loaded);
        Assert.Equal(result, loaded);
    }

    [Fact]
    public async Task Incomplete_profile_is_not_saved()
    {
        var organizationId = Guid.NewGuid();
        await using var db = new NegareshDbContext(
            new DbContextOptionsBuilder<NegareshDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        db.Organizations.Add(new Organization { Id = organizationId, Name = "نام قبلی" });
        await db.SaveChangesAsync();
        var handler = new OrganizationProfileHandler(db,
            new StubTenant(organizationId, "admin"), new NullAudit());

        var result = await handler.Handle(new SaveOrganizationProfileCommand(new(
            "شرکت داده پردازان", "", "ابراهیم", "0012345678", "14001234567",
            "411111111111", "تهران", "02188776655", null, null, null, null, null)), default);

        Assert.Null(result);
        Assert.Equal("نام قبلی", (await db.Organizations.SingleAsync()).Name);
    }

    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
    private sealed class NullAudit : IAuditWriter
    {
        public void Add(string action, string entityType, string? entityId,
            object? metadata = null) { }
    }
}

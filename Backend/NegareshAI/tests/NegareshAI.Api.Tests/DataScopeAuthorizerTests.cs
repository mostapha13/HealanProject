using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class DataScopeAuthorizerTests
{
    [Fact]
    public async Task Admin_has_access_without_explicit_group_assignment()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var authorizer = CreateAuthorizer(db, organizationId, "admin-user", "Admin");

        Assert.True(await authorizer.CanAccessAsync(
            DataScopeResourceType.DocumentGroup, Guid.NewGuid()));
    }

    [Fact]
    public async Task Direct_user_deny_overrides_role_grant()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        db.DataScopeAssignments.AddRange(
            Assignment(organizationId, groupId, DataScopeSubjectType.Role, "Expert", false),
            Assignment(organizationId, groupId, DataScopeSubjectType.User, "user-1", true));
        await db.SaveChangesAsync();
        var authorizer = CreateAuthorizer(db, organizationId, "user-1", "Expert");

        Assert.False(await authorizer.CanAccessAsync(
            DataScopeResourceType.DocumentGroup, groupId));
    }

    [Fact]
    public async Task Direct_user_grant_overrides_role_deny()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        db.DataScopeAssignments.AddRange(
            Assignment(organizationId, groupId, DataScopeSubjectType.Role, "Expert", true),
            Assignment(organizationId, groupId, DataScopeSubjectType.User, "user-1", false));
        await db.SaveChangesAsync();
        var authorizer = CreateAuthorizer(db, organizationId, "user-1", "Expert");

        Assert.True(await authorizer.CanAccessAsync(
            DataScopeResourceType.DocumentGroup, groupId));
    }

    [Fact]
    public async Task User_without_assignment_is_denied_by_default()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var authorizer = CreateAuthorizer(db, organizationId, "user-1", "Expert");

        Assert.False(await authorizer.CanAccessAsync(
            DataScopeResourceType.ContractGroup, Guid.NewGuid()));
    }

    [Fact]
    public async Task Contract_group_assignment_is_evaluated_independently()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var groupId = Guid.NewGuid();
        db.DataScopeAssignments.Add(Assignment(
            organizationId, groupId, DataScopeSubjectType.User, "user-1", false,
            DataScopeResourceType.ContractGroup));
        await db.SaveChangesAsync();
        var authorizer = CreateAuthorizer(db, organizationId, "user-1", "Expert");

        Assert.True(await authorizer.CanAccessAsync(
            DataScopeResourceType.ContractGroup, groupId));
        Assert.False(await authorizer.CanAccessAsync(
            DataScopeResourceType.DocumentGroup, groupId));
    }

    [Fact]
    public async Task Bulk_scope_returns_only_effectively_allowed_resources()
    {
        await using var db = CreateDbContext();
        var organizationId = Guid.NewGuid();
        var roleGranted = Guid.NewGuid();
        var userDenied = Guid.NewGuid();
        var userGranted = Guid.NewGuid();
        db.DataScopeAssignments.AddRange(
            Assignment(organizationId, roleGranted, DataScopeSubjectType.Role,
                "Expert", false),
            Assignment(organizationId, userDenied, DataScopeSubjectType.Role,
                "Expert", false),
            Assignment(organizationId, userDenied, DataScopeSubjectType.User,
                "user-1", true),
            Assignment(organizationId, userGranted, DataScopeSubjectType.Role,
                "Expert", true),
            Assignment(organizationId, userGranted, DataScopeSubjectType.User,
                "user-1", false));
        await db.SaveChangesAsync();
        var authorizer = CreateAuthorizer(db, organizationId, "user-1", "Expert");

        var allowed = await authorizer.GetAllowedResourceIdsAsync(
            DataScopeResourceType.DocumentGroup);

        Assert.NotNull(allowed);
        Assert.Contains(roleGranted, allowed);
        Assert.Contains(userGranted, allowed);
        Assert.DoesNotContain(userDenied, allowed);
    }

    private static DataScopeAssignment Assignment(
        Guid organizationId, Guid resourceId, DataScopeSubjectType subjectType,
        string subjectId, bool denied,
        DataScopeResourceType resourceType = DataScopeResourceType.DocumentGroup) => new()
        {
            OrganizationId = organizationId,
            ResourceType = resourceType,
            ResourceId = resourceId,
            SubjectType = subjectType,
            SubjectId = subjectId,
            IsDenied = denied,
            CreatedByUserId = "seed"
        };

    private static DataScopeAuthorizer CreateAuthorizer(
        NegareshDbContext db, Guid organizationId, string userId, params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new("sub", userId)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "tests"))
        };
        return new DataScopeAuthorizer(
            db, new StubTenant(organizationId, userId),
            new HttpContextAccessor { HttpContext = context });
    }

    private static NegareshDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<NegareshDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new NegareshDbContext(options);
    }

    private sealed record StubTenant(Guid OrganizationId, string UserId) : ICurrentTenant;
}

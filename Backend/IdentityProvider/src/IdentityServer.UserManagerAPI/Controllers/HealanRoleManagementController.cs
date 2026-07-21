#nullable enable

using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using Share.Domain.Exceptions;
using System.Security.Claims;

namespace IdentityServer.UserManagerAPI.Controllers;

[Authorize]
public class HealanRoleManagementController : ApiControllerBase
{
    private readonly ApplicationDbContext _dbContext;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public HealanRoleManagementController(
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager)
    {
        _dbContext = dbContext;
        _roleManager = roleManager;
    }

    [HttpGet("roles")]
    public async Task<ActionResult<IReadOnlyList<HealanRoleResponse>>> ListRoles(
        [FromQuery] bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        await RequireAccessAdministratorAsync(false, cancellationToken);
        var roles = await HealanRoles()
            .Where(x => includeDeleted || !x.IsDeleted)
            .OrderBy(x => x.DisplayName ?? x.Name)
            .Select(x => new HealanRoleResponse(
                x.Id,
                x.Name ?? string.Empty,
                x.DisplayName ?? x.Name ?? string.Empty,
                x.IsSystem,
                x.IsDeleted,
                _dbContext.UserRoles.Count(ur => ur.RoleId == x.Id),
                x.CreatedUtc,
                x.CreatedBy,
                x.ModifiedUtc,
                x.ModifiedBy,
                x.DeletedUtc,
                x.DeletedBy))
            .ToListAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpGet("roles/{roleId:guid}")]
    public async Task<ActionResult<HealanRoleResponse>> GetRole(
        Guid roleId,
        CancellationToken cancellationToken)
    {
        await RequireAccessAdministratorAsync(false, cancellationToken);
        var role = await HealanRoles()
            .Where(x => x.Id == roleId)
            .Select(x => new HealanRoleResponse(
                x.Id,
                x.Name ?? string.Empty,
                x.DisplayName ?? x.Name ?? string.Empty,
                x.IsSystem,
                x.IsDeleted,
                _dbContext.UserRoles.Count(ur => ur.RoleId == x.Id),
                x.CreatedUtc,
                x.CreatedBy,
                x.ModifiedUtc,
                x.ModifiedBy,
                x.DeletedUtc,
                x.DeletedBy))
            .SingleOrDefaultAsync(cancellationToken);
        return role == null ? NotFound() : Ok(role);
    }

    [HttpPost("roles")]
    public async Task<ActionResult<HealanRoleResponse>> CreateRole(
        [FromBody] SaveHealanRoleRequest request,
        CancellationToken cancellationToken)
    {
        var actorId = await RequireAccessAdministratorAsync(true, cancellationToken);
        var name = request.Name?.Trim();
        var displayName = request.DisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(displayName))
            return BadRequest("Name and DisplayName are required.");
        if (string.Equals(name, ConstUserInfo.AdminRole, StringComparison.OrdinalIgnoreCase))
            return BadRequest("Admin is a protected role.");

        var normalizedName = _roleManager.KeyNormalizer.NormalizeName(name);
        if (await _dbContext.Roles.AnyAsync(x => x.NormalizedName == normalizedName, cancellationToken))
            return Conflict("A role with this name already exists, including soft-deleted roles.");

        var role = new ApplicationRole(name)
        {
            DisplayName = displayName,
            CreatedUtc = DateTime.UtcNow,
            CreatedBy = actorId,
        };
        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        _dbContext.AccessSystemRoles.Add(new AccessSystemRole
        {
            RoleId = role.Id,
            AccessSystemId = HealanAccessFormIds.SystemId,
        });
        await _dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetRole), new { roleId = role.Id }, await BuildRoleResponseAsync(role.Id, cancellationToken));
    }

    [HttpPut("roles/{roleId:guid}")]
    public async Task<ActionResult<HealanRoleResponse>> UpdateRole(
        Guid roleId,
        [FromBody] SaveHealanRoleRequest request,
        CancellationToken cancellationToken)
    {
        var actorId = await RequireAccessAdministratorAsync(true, cancellationToken);
        var role = await FindHealanRoleAsync(roleId, cancellationToken);
        if (role == null)
            return NotFound();
        if (IsAdmin(role))
            return BadRequest("Admin is a protected role.");
        if (role.IsDeleted)
            return BadRequest("Restore the role before updating it.");

        var name = request.Name?.Trim();
        var displayName = request.DisplayName?.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(displayName))
            return BadRequest("Name and DisplayName are required.");
        var normalizedName = _roleManager.KeyNormalizer.NormalizeName(name);
        if (await _dbContext.Roles.AnyAsync(x => x.Id != roleId && x.NormalizedName == normalizedName, cancellationToken))
            return Conflict("A role with this name already exists, including soft-deleted roles.");

        role.Name = name;
        role.NormalizedName = normalizedName;
        role.DisplayName = displayName;
        role.ModifiedUtc = DateTime.UtcNow;
        role.ModifiedBy = actorId;
        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
            return BadRequest(result.Errors);
        return Ok(await BuildRoleResponseAsync(role.Id, cancellationToken));
    }

    [HttpDelete("roles/{roleId:guid}")]
    public async Task<IActionResult> DeleteRole(Guid roleId, CancellationToken cancellationToken)
    {
        var actorId = await RequireAccessAdministratorAsync(true, cancellationToken);
        var role = await FindHealanRoleAsync(roleId, cancellationToken);
        if (role == null)
            return NotFound();
        if (IsAdmin(role) || role.IsSystem)
            return BadRequest("System roles cannot be deleted.");
        if (!role.IsDeleted)
        {
            role.IsDeleted = true;
            role.DeletedUtc = DateTime.UtcNow;
            role.DeletedBy = actorId;
            role.ModifiedUtc = role.DeletedUtc;
            role.ModifiedBy = actorId;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        return NoContent();
    }

    [HttpPost("roles/{roleId:guid}/restore")]
    public async Task<ActionResult<HealanRoleResponse>> RestoreRole(
        Guid roleId,
        CancellationToken cancellationToken)
    {
        var actorId = await RequireAccessAdministratorAsync(true, cancellationToken);
        var role = await FindHealanRoleAsync(roleId, cancellationToken);
        if (role == null)
            return NotFound();
        if (IsAdmin(role))
            return BadRequest("Admin is a protected role.");

        role.IsDeleted = false;
        role.DeletedUtc = null;
        role.DeletedBy = null;
        role.ModifiedUtc = DateTime.UtcNow;
        role.ModifiedBy = actorId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(await BuildRoleResponseAsync(role.Id, cancellationToken));
    }

    [HttpGet("users/{userId:guid}/direct-grants")]
    public async Task<ActionResult<DirectUserGrantsResponse>> GetDirectGrants(
        Guid userId,
        [FromQuery] int accessSystemId = HealanAccessFormIds.SystemId,
        CancellationToken cancellationToken = default)
    {
        await RequireAccessAdministratorAsync(false, cancellationToken);
        if (!await _dbContext.Users.AnyAsync(x => x.Id == userId, cancellationToken))
            return NotFound();

        var menuIds = await _dbContext.AccessUserGrants
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.AccessSystemId == accessSystemId && !x.IsDeleted)
            .OrderBy(x => x.AccessMenuId)
            .Select(x => x.AccessMenuId)
            .ToListAsync(cancellationToken);
        return Ok(new DirectUserGrantsResponse(userId, accessSystemId, menuIds));
    }

    [HttpPut("users/{userId:guid}/direct-grants")]
    public async Task<ActionResult<DirectUserGrantsResponse>> SaveDirectGrants(
        Guid userId,
        [FromBody] SaveDirectUserGrantsRequest request,
        CancellationToken cancellationToken)
    {
        var actorId = await RequireAccessAdministratorAsync(true, cancellationToken);
        if (!await _dbContext.Users.AnyAsync(x => x.Id == userId, cancellationToken))
            return NotFound();
        if (!await _dbContext.AccessSystems.AnyAsync(x => x.AccessSystemId == request.AccessSystemId, cancellationToken))
            return BadRequest("Access system does not exist.");

        var requestedMenuIds = (request.AccessMenuIds ?? [])
            .Distinct()
            .ToHashSet();
        var validMenuIds = await (
            from menu in _dbContext.AccessMenus
            join form in _dbContext.AccessForms on menu.AccessFormId equals form.AccessFormId
            where form.AccessSystemId == request.AccessSystemId && requestedMenuIds.Contains(menu.AccessMenuId)
            select menu.AccessMenuId)
            .ToListAsync(cancellationToken);
        if (validMenuIds.Count != requestedMenuIds.Count)
            return BadRequest("Every grant must reference a menu in the requested access system.");

        var now = DateTime.UtcNow;
        var existing = await _dbContext.AccessUserGrants
            .Where(x => x.UserId == userId && x.AccessSystemId == request.AccessSystemId)
            .ToListAsync(cancellationToken);
        foreach (var grant in existing)
        {
            var shouldBeActive = requestedMenuIds.Contains(grant.AccessMenuId);
            if (grant.IsDeleted == shouldBeActive)
            {
                grant.IsDeleted = !shouldBeActive;
                grant.ModifiedUtc = now;
                grant.ModifiedBy = actorId;
                grant.DeletedUtc = shouldBeActive ? null : now;
                grant.DeletedBy = shouldBeActive ? null : actorId;
            }
        }

        var existingMenuIds = existing.Select(x => x.AccessMenuId).ToHashSet();
        foreach (var menuId in requestedMenuIds.Where(x => !existingMenuIds.Contains(x)))
        {
            _dbContext.AccessUserGrants.Add(new AccessUserGrant
            {
                UserId = userId,
                AccessMenuId = menuId,
                AccessSystemId = request.AccessSystemId,
                CreatedUtc = now,
                CreatedBy = actorId,
            });
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new DirectUserGrantsResponse(userId, request.AccessSystemId, requestedMenuIds.Order().ToList()));
    }

    private IQueryable<ApplicationRole> HealanRoles()
    {
        return
            from role in _dbContext.Roles.AsNoTracking()
            join link in _dbContext.AccessSystemRoles.AsNoTracking() on role.Id equals link.RoleId
            where link.AccessSystemId == HealanAccessFormIds.SystemId
                && role.Name != ConstUserInfo.AdminRole
            select role;
    }

    private async Task<ApplicationRole?> FindHealanRoleAsync(Guid roleId, CancellationToken cancellationToken)
    {
        return await (
            from role in _dbContext.Roles
            join link in _dbContext.AccessSystemRoles on role.Id equals link.RoleId
            where role.Id == roleId && link.AccessSystemId == HealanAccessFormIds.SystemId
            select role)
            .SingleOrDefaultAsync(cancellationToken);
    }

    private async Task<HealanRoleResponse> BuildRoleResponseAsync(Guid roleId, CancellationToken cancellationToken)
    {
        return await _dbContext.Roles
            .Where(x => x.Id == roleId)
            .Select(x => new HealanRoleResponse(
                x.Id,
                x.Name ?? string.Empty,
                x.DisplayName ?? x.Name ?? string.Empty,
                x.IsSystem,
                x.IsDeleted,
                _dbContext.UserRoles.Count(ur => ur.RoleId == x.Id),
                x.CreatedUtc,
                x.CreatedBy,
                x.ModifiedUtc,
                x.ModifiedBy,
                x.DeletedUtc,
                x.DeletedBy))
            .SingleAsync(cancellationToken);
    }

    private async Task<Guid> RequireAccessAdministratorAsync(bool mutation, CancellationToken cancellationToken)
    {
        if (User.Identity?.IsAuthenticated != true
            || !Guid.TryParse(User.FindFirstValue("sub"), out var actorId)
            || actorId == Guid.Empty)
            throw new UnauthorizedAccessException("Authenticated user identity is missing.");
        if (mutation && string.Equals(
                User.FindFirstValue(ImpersonationClaimNames.IsImpersonating),
                "true",
                StringComparison.OrdinalIgnoreCase))
            throw new ForbiddenAccessExceptions();

        var isAdmin = await (
            from userRole in _dbContext.UserRoles
            join role in _dbContext.Roles on userRole.RoleId equals role.Id
            where userRole.UserId == actorId
                && role.Name == ConstUserInfo.AdminRole
                && !role.IsDeleted
            select role.Id).AnyAsync(cancellationToken);
        if (isAdmin)
            return actorId;

        var hasRoleGrant = await (
            from userRole in _dbContext.UserRoles
            join role in _dbContext.Roles on userRole.RoleId equals role.Id
            join accessRole in _dbContext.AccessRoles on role.Id equals accessRole.RoleId
            join menu in _dbContext.AccessMenus on accessRole.AccessMenuId equals menu.AccessMenuId
            where userRole.UserId == actorId
                && !role.IsDeleted
                && menu.AccessFormId == HealanAccessFormIds.AccessAdmin
            select accessRole.AccessRoleId).AnyAsync(cancellationToken);
        var hasDirectGrant = await (
            from grant in _dbContext.AccessUserGrants
            join menu in _dbContext.AccessMenus on grant.AccessMenuId equals menu.AccessMenuId
            where grant.UserId == actorId
                && grant.AccessSystemId == HealanAccessFormIds.SystemId
                && !grant.IsDeleted
                && menu.AccessFormId == HealanAccessFormIds.AccessAdmin
            select grant.AccessUserGrantId).AnyAsync(cancellationToken);
        if (!hasRoleGrant && !hasDirectGrant)
            throw new ForbiddenAccessExceptions();
        return actorId;
    }

    private static bool IsAdmin(ApplicationRole role) =>
        string.Equals(role.Name, ConstUserInfo.AdminRole, StringComparison.OrdinalIgnoreCase);
}

public sealed record SaveHealanRoleRequest(string Name, string DisplayName);

public sealed record HealanRoleResponse(
    Guid Id,
    string Name,
    string DisplayName,
    bool IsSystem,
    bool IsDeleted,
    int UserCount,
    DateTime CreatedUtc,
    Guid? CreatedBy,
    DateTime? ModifiedUtc,
    Guid? ModifiedBy,
    DateTime? DeletedUtc,
    Guid? DeletedBy);

public sealed record SaveDirectUserGrantsRequest(int AccessSystemId, IReadOnlyList<int>? AccessMenuIds);

public sealed record DirectUserGrantsResponse(Guid UserId, int AccessSystemId, IReadOnlyList<int> AccessMenuIds);

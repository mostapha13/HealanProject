#nullable enable

using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using System.Security.Claims;

namespace IdentityServer.UserManagerAPI.Controllers;

[Authorize]
public sealed class NegareshAIIdentityManagementController(
    ApplicationDbContext db,
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager) : ApiControllerBase
{
    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] bool includeDeleted = false, CancellationToken ct = default)
    {
        await RequireAsync(NegareshAIAccessFormIds.Users, false, ct);
        var users = await db.Users.AsNoTracking()
            .Where(x => includeDeleted || !x.IsDeleted)
            .OrderBy(x => x.UserName)
            .Select(x => new
            {
                x.Id, x.UserName, x.FirstName, x.LastName, x.Email, x.PhoneNumber,
                x.IsActive, x.IsDeleted, x.CreatedUtc, x.CreatedBy, x.ModifiedUtc,
                x.ModifiedBy, x.DeletedUtc, x.DeletedBy,
                RoleIds = db.UserRoles.Where(ur => ur.UserId == x.Id).Select(ur => ur.RoleId).ToList()
            }).ToListAsync(ct);
        return Ok(users);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(SaveNegareshUserRequest request, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Users, true, ct);
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("UserName and Password are required.");
        var user = new ApplicationUser
        {
            UserName = request.UserName.Trim(),
            Email = request.Email?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            IsActive = request.IsActive,
            IsDeleted = false,
            CreatedUtc = DateTime.UtcNow,
            CreatedBy = actor,
            DepartmentId = DepartmentId.Software,
            SecurityStamp = Guid.NewGuid().ToString("D"),
        };
        var result = await userManager.CreateAsync(user, request.Password!);
        if (!result.Succeeded) return BadRequest(result.Errors);
        await ReplaceUserRolesAsync(user, request.RoleIds, ct);
        return Ok(new { user.Id });
    }

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, SaveNegareshUserRequest request, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Users, true, ct);
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (user == null) return NotFound();
        if (string.Equals(user.UserName, ConstUserInfo.AdminUserName, StringComparison.OrdinalIgnoreCase)
            && !request.IsActive) return BadRequest("AdminUser cannot be deactivated.");
        user.UserName = request.UserName.Trim();
        user.NormalizedUserName = userManager.NormalizeName(user.UserName);
        user.Email = request.Email?.Trim();
        user.NormalizedEmail = userManager.NormalizeEmail(user.Email);
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.IsActive = request.IsActive;
        user.ModifiedUtc = DateTime.UtcNow;
        user.ModifiedBy = actor;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            result = await userManager.ResetPasswordAsync(user, token, request.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);
        }
        await ReplaceUserRolesAsync(user, request.RoleIds, ct);
        return NoContent();
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Users, true, ct);
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user == null) return NotFound();
        if (string.Equals(user.UserName, ConstUserInfo.AdminUserName, StringComparison.OrdinalIgnoreCase))
            return BadRequest("AdminUser is protected.");
        user.IsDeleted = true; user.IsActive = false; user.DeletedUtc = DateTime.UtcNow;
        user.DeletedBy = actor; user.ModifiedUtc = user.DeletedUtc; user.ModifiedBy = actor;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("users/{id:guid}/restore")]
    public async Task<IActionResult> RestoreUser(Guid id, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Users, true, ct);
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user == null) return NotFound();
        user.IsDeleted = false; user.IsActive = true; user.DeletedUtc = null; user.DeletedBy = null;
        user.ModifiedUtc = DateTime.UtcNow; user.ModifiedBy = actor;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("roles")]
    public async Task<IActionResult> Roles(CancellationToken ct)
    {
        await RequireAsync(NegareshAIAccessFormIds.Roles, false, ct);
        var roles = await (
            from role in db.Roles.AsNoTracking()
            join link in db.AccessSystemRoles on role.Id equals link.RoleId
            where link.AccessSystemId == NegareshAIAccessFormIds.SystemId
            select new { role.Id, role.Name, role.DisplayName, role.IsSystem, role.IsDeleted })
            .OrderBy(x => x.DisplayName).ToListAsync(ct);
        return Ok(roles);
    }

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole(SaveNegareshRoleRequest request, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Roles, true, ct);
        var role = new ApplicationRole(request.Name.Trim())
        {
            DisplayName = request.DisplayName.Trim(), CreatedUtc = DateTime.UtcNow, CreatedBy = actor
        };
        var result = await roleManager.CreateAsync(role);
        if (!result.Succeeded) return BadRequest(result.Errors);
        db.AccessSystemRoles.Add(new AccessSystemRole { RoleId = role.Id, AccessSystemId = NegareshAIAccessFormIds.SystemId });
        await db.SaveChangesAsync(ct);
        return Ok(new { role.Id });
    }

    [HttpPut("roles/{id:guid}")]
    public async Task<IActionResult> UpdateRole(Guid id, SaveNegareshRoleRequest request, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Roles, true, ct);
        var role = await NegareshRoles().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (role == null) return NotFound();
        if (role.IsSystem || string.Equals(role.Name, ConstUserInfo.AdminRole, StringComparison.OrdinalIgnoreCase))
            return BadRequest("System role is protected.");
        role.Name = request.Name.Trim(); role.NormalizedName = roleManager.NormalizeKey(role.Name);
        role.DisplayName = request.DisplayName.Trim(); role.ModifiedUtc = DateTime.UtcNow; role.ModifiedBy = actor;
        var result = await roleManager.UpdateAsync(role);
        return result.Succeeded ? NoContent() : BadRequest(result.Errors);
    }

    [HttpDelete("roles/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Roles, true, ct);
        var role = await NegareshRoles().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (role == null) return NotFound();
        if (role.IsSystem || string.Equals(role.Name, ConstUserInfo.AdminRole, StringComparison.OrdinalIgnoreCase))
            return BadRequest("System role is protected.");
        role.IsDeleted = true; role.DeletedUtc = DateTime.UtcNow; role.DeletedBy = actor;
        role.ModifiedUtc = role.DeletedUtc; role.ModifiedBy = actor;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("roles/{id:guid}/restore")]
    public async Task<IActionResult> RestoreRole(Guid id, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.Roles, true, ct);
        var role = await NegareshRoles().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (role == null) return NotFound();
        role.IsDeleted = false; role.DeletedUtc = null; role.DeletedBy = null;
        role.ModifiedUtc = DateTime.UtcNow; role.ModifiedBy = actor;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPut("roles/{id:guid}/permissions")]
    public async Task<IActionResult> SaveRolePermissions(Guid id, SaveMenuPermissionsRequest request, CancellationToken ct)
    {
        await RequireAsync(NegareshAIAccessFormIds.RolePermissions, true, ct);
        var valid = await SystemMenuIds().Where(x => request.AccessMenuIds.Contains(x)).ToListAsync(ct);
        if (valid.Count != request.AccessMenuIds.Distinct().Count()) return BadRequest("Invalid menu.");
        var existing = await db.AccessRoles.Where(x => x.RoleId == id).ToListAsync(ct);
        db.AccessRoles.RemoveRange(existing.Where(x => !valid.Contains(x.AccessMenuId)));
        var existingIds = existing.Select(x => x.AccessMenuId).ToHashSet();
        db.AccessRoles.AddRange(valid.Where(x => !existingIds.Contains(x))
            .Select(x => new AccessRole { RoleId = id, AccessMenuId = x, HasPersianAccess = true }));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("roles/{id:guid}/permissions")]
    public async Task<IActionResult> RolePermissions(Guid id, CancellationToken ct)
    {
        await RequireAsync(NegareshAIAccessFormIds.RolePermissions, false, ct);
        var ids = await (from access in db.AccessRoles
            join menuId in SystemMenuIds() on access.AccessMenuId equals menuId
            where access.RoleId == id select access.AccessMenuId).ToListAsync(ct);
        return Ok(new { accessMenuIds = ids });
    }

    private IQueryable<int> SystemMenuIds() =>
        from menu in db.AccessMenus
        join form in db.AccessForms on menu.AccessFormId equals form.AccessFormId
        where form.AccessSystemId == NegareshAIAccessFormIds.SystemId
        select menu.AccessMenuId;

    private IQueryable<ApplicationRole> NegareshRoles() =>
        from role in db.Roles
        join link in db.AccessSystemRoles on role.Id equals link.RoleId
        where link.AccessSystemId == NegareshAIAccessFormIds.SystemId
        select role;

    private async Task ReplaceUserRolesAsync(ApplicationUser user, IReadOnlyList<Guid>? roleIds, CancellationToken ct)
    {
        var validRoleNames = await (
            from role in db.Roles
            join link in db.AccessSystemRoles on role.Id equals link.RoleId
            where link.AccessSystemId == NegareshAIAccessFormIds.SystemId
                && (roleIds ?? Array.Empty<Guid>()).Contains(role.Id) && !role.IsDeleted
            select role.Name!).ToListAsync(ct);
        var current = await (
            from ur in db.UserRoles
            join role in db.Roles on ur.RoleId equals role.Id
            join link in db.AccessSystemRoles on role.Id equals link.RoleId
            where ur.UserId == user.Id && link.AccessSystemId == NegareshAIAccessFormIds.SystemId
            select role.Name!).ToListAsync(ct);
        if (current.Count > 0) await userManager.RemoveFromRolesAsync(user, current);
        if (validRoleNames.Count > 0) await userManager.AddToRolesAsync(user, validRoleNames);
    }

    private async Task<Guid> RequireAsync(int formId, bool mutation, CancellationToken ct)
    {
        if (!Guid.TryParse(User.FindFirstValue("sub"), out var actor) || actor == Guid.Empty)
            throw new UnauthorizedAccessException();
        if (mutation && string.Equals(User.FindFirstValue(ImpersonationClaimNames.IsImpersonating), "true", StringComparison.OrdinalIgnoreCase))
            throw new ForbiddenAccessExceptions();
        var admin = await (from ur in db.UserRoles join role in db.Roles on ur.RoleId equals role.Id
            where ur.UserId == actor && role.Name == ConstUserInfo.AdminRole && !role.IsDeleted select role.Id).AnyAsync(ct);
        if (admin) return actor;
        var denied = await (from deny in db.AccessUserDenies join menu in db.AccessMenus on deny.AccessMenuId equals menu.AccessMenuId
            where deny.UserId == actor && !deny.IsDeleted && menu.AccessFormId == formId select deny.AccessUserDenyId).AnyAsync(ct);
        if (denied) throw new ForbiddenAccessExceptions();
        var granted = await (from ur in db.UserRoles join role in db.Roles on ur.RoleId equals role.Id
            join access in db.AccessRoles on role.Id equals access.RoleId join menu in db.AccessMenus on access.AccessMenuId equals menu.AccessMenuId
            where ur.UserId == actor && !role.IsDeleted && menu.AccessFormId == formId select access.AccessRoleId).AnyAsync(ct)
            || await (from grant in db.AccessUserGrants join menu in db.AccessMenus on grant.AccessMenuId equals menu.AccessMenuId
                where grant.UserId == actor && !grant.IsDeleted && menu.AccessFormId == formId select grant.AccessUserGrantId).AnyAsync(ct);
        if (!granted) throw new ForbiddenAccessExceptions();
        return actor;
    }
}

public sealed record SaveNegareshUserRequest(string UserName, string FirstName, string LastName,
    string? Email, string? PhoneNumber, string? Password, bool IsActive, IReadOnlyList<Guid>? RoleIds);
public sealed record SaveNegareshRoleRequest(string Name, string DisplayName);
public sealed record SaveMenuPermissionsRequest(IReadOnlyList<int> AccessMenuIds);

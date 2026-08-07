#nullable enable

using IdentityServer.Domain.Data;
using IdentityServer.Domain.Security;
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

    [HttpGet("menus")]
    public async Task<IActionResult> Menus(CancellationToken ct)
    {
        await RequireAnyAsync([NegareshAIAccessFormIds.AccessDefinitions,
            NegareshAIAccessFormIds.RolePermissions, NegareshAIAccessFormIds.UserPermissions], ct);
        var flat = await (from menu in db.AccessMenus.AsNoTracking()
            join form in db.AccessForms.AsNoTracking() on menu.AccessFormId equals form.AccessFormId into forms
            from form in forms.DefaultIfEmpty()
            where form == null || form.AccessSystemId == NegareshAIAccessFormIds.SystemId
            orderby menu.Order
            select new ManagementAccessMenu
            {
                AccessMenuId = menu.AccessMenuId, AccessFormId = menu.AccessFormId,
                ParentRef = menu.ParentRef, Order = menu.Order, Title = menu.Title,
                IsActive = menu.IsActive,
                AccessForm = form == null ? null : new ManagementAccessForm
                { AccessFormId = form.AccessFormId, FormTitle = form.FormTitle, Url = form.URL }
            }).ToListAsync(ct);
        var ids = flat.Where(x => x.AccessForm != null).Select(x => x.AccessMenuId).ToHashSet();
        var byId = flat.ToDictionary(x => x.AccessMenuId);
        foreach (var id in ids.ToArray())
        {
            var current = byId[id];
            while (current.ParentRef.HasValue && byId.TryGetValue(current.ParentRef.Value, out var parent))
            { ids.Add(parent.AccessMenuId); current = parent; }
        }
        var selected = flat.Where(x => ids.Contains(x.AccessMenuId)).ToList();
        var selectedById = selected.ToDictionary(x => x.AccessMenuId);
        foreach (var item in selected)
            if (item.ParentRef.HasValue && selectedById.TryGetValue(item.ParentRef.Value, out var parent))
                parent.Children.Add(item);
        return Ok(selected.Where(x => !x.ParentRef.HasValue || !selectedById.ContainsKey(x.ParentRef.Value))
            .OrderBy(x => x.Order));
    }

    [HttpGet("users/{id:guid}/direct-access")]
    public async Task<IActionResult> DirectAccess(Guid id, CancellationToken ct)
    {
        await RequireAsync(NegareshAIAccessFormIds.UserPermissions, false, ct);
        if (!await db.Users.AnyAsync(x => x.Id == id, ct)) return NotFound();
        var grants = await db.AccessUserGrants.AsNoTracking().Where(x => x.UserId == id
            && x.AccessSystemId == NegareshAIAccessFormIds.SystemId && !x.IsDeleted)
            .Select(x => x.AccessMenuId).ToListAsync(ct);
        var denies = await db.AccessUserDenies.AsNoTracking().Where(x => x.UserId == id
            && x.AccessSystemId == NegareshAIAccessFormIds.SystemId && !x.IsDeleted)
            .Select(x => x.AccessMenuId).ToListAsync(ct);
        return Ok(new { grants, denies });
    }

    [HttpPut("users/{id:guid}/direct-access")]
    public async Task<IActionResult> SaveDirectAccess(Guid id, SaveDirectAccessRequest request, CancellationToken ct)
    {
        var actor = await RequireAsync(NegareshAIAccessFormIds.UserPermissions, true, ct);
        if (!await db.Users.AnyAsync(x => x.Id == id, ct)) return NotFound();
        var valid = (await SystemMenuIds().ToListAsync(ct)).ToHashSet();
        var grants = (request.Grants ?? []).Distinct().ToHashSet();
        var denies = (request.Denies ?? []).Distinct().ToHashSet();
        if (grants.Overlaps(denies) || grants.Any(x => !valid.Contains(x)) || denies.Any(x => !valid.Contains(x)))
            return BadRequest("مجوزهای انتخاب‌شده معتبر نیستند.");
        await SyncDirectAccess(db.AccessUserGrants, id, grants, actor, ct);
        await SyncDirectAccess(db.AccessUserDenies, id, denies, actor, ct);
        await db.SaveChangesAsync(ct);
        return NoContent();
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
        var admin = await AdminUserAccessPolicy.HasFullAccessAsync(db, actor, ct);
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

    private async Task<Guid> RequireAnyAsync(IReadOnlyCollection<int> formIds, CancellationToken ct)
    {
        foreach (var formId in formIds)
            try { return await RequireAsync(formId, false, ct); }
            catch (ForbiddenAccessExceptions) { }
        throw new ForbiddenAccessExceptions();
    }

    private async Task SyncDirectAccess<T>(DbSet<T> set, Guid userId, HashSet<int> requested,
        Guid actor, CancellationToken ct) where T : class
    {
        var now = DateTime.UtcNow;
        if (typeof(T) == typeof(AccessUserGrant))
        {
            var rows = await db.AccessUserGrants.Where(x => x.UserId == userId
                && x.AccessSystemId == NegareshAIAccessFormIds.SystemId).ToListAsync(ct);
            foreach (var row in rows) { var active = requested.Contains(row.AccessMenuId); row.IsDeleted = !active; row.ModifiedUtc = now; row.ModifiedBy = actor; row.DeletedUtc = active ? null : now; row.DeletedBy = active ? null : actor; }
            foreach (var menuId in requested.Except(rows.Select(x => x.AccessMenuId))) db.AccessUserGrants.Add(new AccessUserGrant { UserId=userId, AccessSystemId=NegareshAIAccessFormIds.SystemId, AccessMenuId=menuId, CreatedUtc=now, CreatedBy=actor });
        }
        else
        {
            var rows = await db.AccessUserDenies.Where(x => x.UserId == userId
                && x.AccessSystemId == NegareshAIAccessFormIds.SystemId).ToListAsync(ct);
            foreach (var row in rows) { var active = requested.Contains(row.AccessMenuId); row.IsDeleted = !active; row.ModifiedUtc = now; row.ModifiedBy = actor; row.DeletedUtc = active ? null : now; row.DeletedBy = active ? null : actor; }
            foreach (var menuId in requested.Except(rows.Select(x => x.AccessMenuId))) db.AccessUserDenies.Add(new AccessUserDeny { UserId=userId, AccessSystemId=NegareshAIAccessFormIds.SystemId, AccessMenuId=menuId, CreatedUtc=now, CreatedBy=actor });
        }
    }
}

public sealed record SaveNegareshUserRequest(string UserName, string FirstName, string LastName,
    string? Email, string? PhoneNumber, string? Password, bool IsActive, IReadOnlyList<Guid>? RoleIds);
public sealed record SaveNegareshRoleRequest(string Name, string DisplayName);
public sealed record SaveMenuPermissionsRequest(IReadOnlyList<int> AccessMenuIds);
public sealed record SaveDirectAccessRequest(IReadOnlyList<int>? Grants, IReadOnlyList<int>? Denies);
public sealed class ManagementAccessForm { public int AccessFormId { get; set; } public string FormTitle { get; set; } = ""; public string Url { get; set; } = ""; }
public sealed class ManagementAccessMenu
{
    public int AccessMenuId { get; set; } public int? AccessFormId { get; set; }
    public int? ParentRef { get; set; } public int Order { get; set; }
    public string? Title { get; set; } public bool IsActive { get; set; }
    public ManagementAccessForm? AccessForm { get; set; }
    public List<ManagementAccessMenu> Children { get; set; } = [];
}

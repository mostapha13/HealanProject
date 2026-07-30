using Microsoft.EntityFrameworkCore;
using IdentityServer.Domain.Data;

namespace IdentityServer.Domain.Security;

/// <summary>
/// Central invariant for the protected emergency administrator.
/// AdminUser and active members of the protected Admin role have unrestricted
/// access to every active menu and AccessForm in every AccessSystem.
/// </summary>
public static class AdminUserAccessPolicy
{
    public static async Task<bool> HasFullAccessAsync(
        ApplicationDbContext db,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var isProtectedAdminUser = await db.Users.AsNoTracking().AnyAsync(
            user => user.Id == userId
                && user.IsActive
                && user.NormalizedUserName == ConstUserInfo.AdminUserName.ToUpper(),
            cancellationToken);
        if (isProtectedAdminUser) return true;

        return await (
            from userRole in db.UserRoles.AsNoTracking()
            join role in db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            join user in db.Users.AsNoTracking() on userRole.UserId equals user.Id
            where userRole.UserId == userId
                && user.IsActive
                && !role.IsDeleted
                && role.NormalizedName == ConstUserInfo.AdminRole.ToUpper()
            select userRole.RoleId
        ).AnyAsync(cancellationToken);
    }
}

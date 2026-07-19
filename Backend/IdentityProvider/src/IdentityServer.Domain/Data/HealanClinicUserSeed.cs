using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;
using Share.Domain.Enums;
using Share.Domain.Models.UserAccessModels;

namespace IdentityServer.Domain.Data;

/// <summary>
/// کاربران پیش‌فرض کلینیک Healan (منشی، پزشک، حسابدار).
/// هر کاربر فقط یک نقش Identity دارد — بدون Admin یا Healan اضافه.
/// </summary>
public static class HealanClinicUserSeed
{
    private sealed record ClinicUserDef(string Phone, string Role, string FirstName, string LastName, DepartmentId DepartmentId);

    private static readonly ClinicUserDef[] Users =
    {
        new("09122221010", HealanClinicAccess.SecretaryRole, "سارا", "منشی", DepartmentId.Public),
        new("09122221020", HealanClinicAccess.DoctorRole, "رضا", "متخصص قلب", DepartmentId.Doctor),
        new("09122221030", HealanClinicAccess.AccountantRole, "مریم", "حسابدار", DepartmentId.Public),
    };

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        await EnsureRoleExistsAsync(roleManager, HealanClinicAccess.SiteUserRole);
        await EnsureRoleExistsAsync(roleManager, HealanClinicAccess.PatientRole);

        foreach (var def in Users)
        {
            await EnsureRoleExistsAsync(roleManager, def.Role);
            await EnsureUserAsync(dbContext, userManager, def);
        }
    }

    private static async Task EnsureRoleExistsAsync(RoleManager<ApplicationRole> roleManager, string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName))
            return;

        var result = await roleManager.CreateAsync(new ApplicationRole(roleName)
        {
            DisplayName = roleName switch
            {
                HealanClinicAccess.SecretaryRole => "منشی",
                HealanClinicAccess.DoctorRole => "پزشک",
                HealanClinicAccess.AccountantRole => "حسابدار",
                HealanClinicAccess.SiteUserRole => "کاربر سایت",
                HealanClinicAccess.PatientRole => "بیمار",
                _ => roleName,
            },
        });

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create role {roleName}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }

    private static async Task EnsureUserAsync(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ClinicUserDef def)
    {
        var user = await userManager.FindByNameAsync(def.Phone);
        user ??= await userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == def.Phone);

        if (user == null)
        {
            user = new ApplicationUser
            {
                FirstName = def.FirstName,
                LastName = def.LastName,
                UserName = def.Phone,
                Email = $"{def.Phone}@healan.local",
                EmailConfirmed = true,
                PhoneNumber = def.Phone,
                PhoneNumberConfirmed = true,
                IsActive = true,
                LastLoginIP = "0.0.0.0",
                DepartmentId = def.DepartmentId,
            };

            var createResult = await userManager.CreateAsync(user, HealanClinicAccess.ClinicDefaultPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to create clinic user {def.Phone}: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }
        }
        else
        {
            user.FirstName = def.FirstName;
            user.LastName = def.LastName;
            user.UserName = def.Phone;
            user.PhoneNumber = def.Phone;
            user.PhoneNumberConfirmed = true;
            user.EmailConfirmed = true;
            user.IsActive = true;
            user.DepartmentId = def.DepartmentId;

            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to update clinic user {def.Phone}: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
            }

            if (await userManager.HasPasswordAsync(user))
            {
                var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await userManager.ResetPasswordAsync(user, resetToken, HealanClinicAccess.ClinicDefaultPassword);
                if (!resetResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to reset password for {def.Phone}: {string.Join(", ", resetResult.Errors.Select(e => e.Description))}");
                }
            }
            else
            {
                var addPassResult = await userManager.AddPasswordAsync(user, HealanClinicAccess.ClinicDefaultPassword);
                if (!addPassResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to set password for {def.Phone}: {string.Join(", ", addPassResult.Errors.Select(e => e.Description))}");
                }
            }
        }

        // فقط یک نقش — حذف Admin، Healan و هر نقش اضافه
        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Count > 0)
            await userManager.RemoveFromRolesAsync(user, currentRoles);

        var roleResult = await userManager.AddToRoleAsync(user, def.Role);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign role {def.Role} to {def.Phone}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }

        await SyncHealanSystemRolesAsync(dbContext, user.Id, def.Role);
    }

    /// <summary>
    /// نقش‌های سامانه Healan را به همان یک نقش کلینیک محدود می‌کند (بدون Healan/Admin اضافه).
    /// </summary>
    private static async Task SyncHealanSystemRolesAsync(ApplicationDbContext dbContext, Guid userId, string roleName)
    {
        var accessSystemId = HealanAccessFormIds.SystemId;

        var systemRoleIds = await dbContext.AccessSystemRoles
            .AsNoTracking()
            .Where(r => r.AccessSystemId == accessSystemId)
            .Select(r => r.RoleId)
            .ToListAsync();

        if (systemRoleIds.Count == 0)
            return;

        var staleAssignments = await (
            from ur in dbContext.UserRoles
            join r in dbContext.Roles on ur.RoleId equals r.Id
            where ur.UserId == userId && systemRoleIds.Contains(r.Id)
            select ur).ToListAsync();

        if (staleAssignments.Count > 0)
            dbContext.UserRoles.RemoveRange(staleAssignments);

        var targetRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (targetRole != null
            && systemRoleIds.Contains(targetRole.Id)
            && !await dbContext.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == targetRole.Id))
        {
            dbContext.UserRoles.Add(new IdentityUserRole<Guid>
            {
                UserId = userId,
                RoleId = targetRole.Id,
            });
        }

        await dbContext.SaveChangesAsync();
    }
}

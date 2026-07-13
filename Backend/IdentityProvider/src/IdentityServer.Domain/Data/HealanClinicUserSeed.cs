using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Enums;
namespace IdentityServer.Domain.Data;

/// <summary>
/// کاربران پیش‌فرض کلینیک Healan (منشی، پزشک، حسابدار).
/// </summary>
public static class HealanClinicUserSeed
{
    private sealed record ClinicUserDef(string Phone, string Role, string FirstName, string LastName);

    private static readonly ClinicUserDef[] Users =
    {
        new("09122221010", HealanClinicAccess.SecretaryRole, "سارا", "منشی"),
        new("09122221020", HealanClinicAccess.DoctorRole, "رضا", "متخصص قلب"),
        new("09122221030", HealanClinicAccess.AccountantRole, "مریم", "حسابدار"),
    };

    public static async Task SeedAsync(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        foreach (var def in Users)
        {
            await EnsureRoleExistsAsync(roleManager, def.Role);
            await EnsureUserAsync(userManager, def);
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
                _ => roleName,
            },
        });

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to create role {roleName}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }

    private static async Task EnsureUserAsync(UserManager<ApplicationUser> userManager, ClinicUserDef def)
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
                DepartmentId = DepartmentId.Public,
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

        var currentRoles = await userManager.GetRolesAsync(user);
        if (currentRoles.Count > 0)
            await userManager.RemoveFromRolesAsync(user, currentRoles);

        var roleResult = await userManager.AddToRoleAsync(user, def.Role);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign role {def.Role} to {def.Phone}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }
    }
}

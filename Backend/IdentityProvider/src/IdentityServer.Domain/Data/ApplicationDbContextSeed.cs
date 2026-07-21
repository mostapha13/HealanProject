using IdentityServer;
using IdentityServer.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Extensions;
using Share.Domain.Models.UserAccessModels;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Linq;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;

namespace IdentityServer.Domain.Data
{
    public static class ApplicationDbContextSeed
    {
        public static async Task SeedAdmin(this ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {

            await AddRoles(dbContext, roleManager);
            var adminUser = await userManager.Users.FirstOrDefaultAsync(x => x.UserName == ConstUserInfo.AdminUserName);
            if (adminUser == null)
            {
                await AddUser(userManager, ConstUserInfo.AdminRole, ConstUserInfo.AdminUserName, ConstUserInfo.AdminPass, ConstUserInfo.AdminFirstName, ConstUserInfo.AdminLastName);
                adminUser = await userManager.Users.FirstAsync(x => x.UserName == ConstUserInfo.AdminUserName);
            }

            // Repair this invariant on every startup; role edits or old data must never
            // leave the emergency administrator without the protected Admin role.
            if (!await userManager.IsInRoleAsync(adminUser, ConstUserInfo.AdminRole))
            {
                var result = await userManager.AddToRoleAsync(adminUser, ConstUserInfo.AdminRole);
                if (!result.Succeeded)
                    throw new InvalidOperationException($"Failed to repair AdminUser membership: {string.Join(", ", result.Errors.Select(x => x.Description))}");
            }
        }

        private static async Task AddRoles(ApplicationDbContext dbContext, RoleManager<ApplicationRole> roleManager)
        {
            var allRole = EnumExtensions.GetEnumInfo<UserAccesRoleId>();
            var existingRoles = await dbContext.Roles.ToListAsync();
            var existingRoleNames = existingRoles.Select(r => r.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var item in allRole.Where(w => !existingRoleNames.Contains(w.Name)))
            {
                var role = new ApplicationRole(item.Name)
                {
                    DisplayName = item.DisplayName
                };
                await roleManager.CreateAsync(role);
            }

            var rolesMissingDisplayName = existingRoles.Where(r => string.IsNullOrEmpty(r.DisplayName)).ToList();
            foreach (var role in rolesMissingDisplayName)
            {
                var enumInfo = allRole.FirstOrDefault(e => e.Name == role.Name);
                if (enumInfo != null)
                {
                    role.DisplayName = enumInfo.DisplayName;
                }
            }

            if (rolesMissingDisplayName.Count > 0)
                await dbContext.SaveChangesAsync();

            var adminRole = await dbContext.Roles.IgnoreQueryFilters()
                .FirstAsync(r => r.NormalizedName == ConstUserInfo.AdminRole.ToUpperInvariant());
            adminRole.IsSystem = true;
            adminRole.IsDeleted = false;
            adminRole.DeletedUtc = null;
            adminRole.DeletedBy = null;
            if (adminRole.CreatedUtc == default)
                adminRole.CreatedUtc = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }

        private static async Task AddUser(UserManager<ApplicationUser> userManager, string roleName, string userName, string pass, string firstName, string lastName)
        {
            var adminUser = new ApplicationUser
            {
                FirstName = firstName,
                LastName = lastName,
                UserName = userName,
                EmailConfirmed = true,
                Email = userName + "@tse.ir",
                NormalizedEmail = userName + "@tse.ir",
                PhoneNumber = "09120000000",
                PhoneNumberConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString("D"),
                IsActive = true,
                LastLoginIP="0.0.0.0",
                DepartmentId = Share.Domain.Enums.DepartmentId.Software,
            };
           var aaa= await userManager.CreateAsync(adminUser, pass);
            await userManager.AddToRoleAsync(adminUser, roleName);
        }
    }
}

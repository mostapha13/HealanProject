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
            var isExistAdminUser = await userManager.Users.FirstOrDefaultAsync(x => x.UserName == ConstUserInfo.AdminUserName);
            if (isExistAdminUser == null)
                await AddUser(userManager, ConstUserInfo.AdminRole, ConstUserInfo.AdminUserName, ConstUserInfo.AdminPass, ConstUserInfo.AdminFirstName, ConstUserInfo.AdminLastName);

            await HealanClinicUserSeed.SeedAsync(userManager, roleManager);
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

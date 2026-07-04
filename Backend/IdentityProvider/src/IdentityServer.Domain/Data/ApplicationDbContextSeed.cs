using IdentityServer;
using IdentityServer.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Extensions;
using Share.Domain.Models.UserAccessModels;
using System;
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
        }

        private static async Task AddRoles(ApplicationDbContext dbContext, RoleManager<ApplicationRole> roleManager)
        {
            var isExistTempRole = await roleManager.RoleExistsAsync(ConstUserInfo.AdminRole);
            if (isExistTempRole == false)
            {
                var role = new ApplicationRole(ConstUserInfo.AdminRole);
                await roleManager.CreateAsync(role);
            }
            var allRole = EnumExtensions.GetEnumInfo<UserAccesRoleId>();

            var allExistRoleNames = await dbContext.Roles.Select(s => s.Name).ToListAsync();
            var allNotExistRole = allRole.Where(w => !allExistRoleNames.Contains(w.Name));
            foreach (var item in allNotExistRole)
            {
                ApplicationRole applicationRole = new ApplicationRole() { Id = Guid.NewGuid(), Name = item.Name, NormalizedName = item.Name.ToUpper(), DisplayName = item.DisplayName, ConcurrencyStamp = Guid.NewGuid().ToString() };
                dbContext.Add(applicationRole);
            }
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

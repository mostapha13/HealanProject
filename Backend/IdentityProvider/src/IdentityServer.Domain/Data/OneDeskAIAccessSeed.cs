using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;

namespace IdentityServer.Domain.Data;

public static class OneDeskAIAccessSeed
{
    public const string UserRole = "OneDeskAI.User";
    public const string AdminRole = "OneDeskAI.Admin";

    private sealed record Form(int Id, string Title, string Url);
    private sealed record Menu(int Id, int? FormId, int? ParentId, int Order, string Title);

    public static async Task SeedAsync(ApplicationDbContext db, RoleManager<ApplicationRole> roleManager)
    {
        var systemAtId = await db.AccessSystems.FirstOrDefaultAsync(x => x.AccessSystemId == OneDeskAIAccessFormIds.SystemId);
        if (systemAtId != null && !string.Equals(systemAtId.SystemName, OneDeskAIAccessFormIds.SystemName, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"AccessSystemId {OneDeskAIAccessFormIds.SystemId} is already used by {systemAtId.SystemName}.");

        var forms = new[]
        {
            new Form(OneDeskAIAccessFormIds.Chat, "Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯", "/chat"),
            new Form(OneDeskAIAccessFormIds.Admin, "Ù…Ø±Ú©Ø² Ù…Ø¯ÛŒØ±ÛŒØª", "/admin"),
            new Form(OneDeskAIAccessFormIds.Systems, "Ø³Ø§Ù…Ø§Ù†Ù‡â€ŒÙ‡Ø§", "/admin/systems"),
            new Form(OneDeskAIAccessFormIds.DataSources, "Ù…Ù†Ø§Ø¨Ø¹ Ø¯Ø§Ø¯Ù‡", "/admin/data-sources"),
            new Form(OneDeskAIAccessFormIds.Capabilities, "Ù‚Ø§Ø¨Ù„ÛŒØªâ€ŒÙ‡Ø§ Ùˆ Ø§Ø¨Ø²Ø§Ø±Ù‡Ø§", "/admin/capabilities"),
            new Form(OneDeskAIAccessFormIds.Knowledge, "Ø¯Ø§Ù†Ø´ Ø³Ø§Ø²Ù…Ø§Ù†ÛŒ", "/admin/knowledge"),
            new Form(OneDeskAIAccessFormIds.ActiveDirectory, "Active Directory", "/admin/active-directory"),
            new Form(OneDeskAIAccessFormIds.Learning, "ÛŒØ§Ø¯Ú¯ÛŒØ±ÛŒ Ùˆ Ø¨Ø§Ø²Ø®ÙˆØ±Ø¯", "/admin/learning"),
            new Form(OneDeskAIAccessFormIds.Platform, "Ø³Ù„Ø§Ù…Øª Ù¾Ù„ØªÙØ±Ù…", "/platform"),
            new Form(OneDeskAIAccessFormIds.Profile, "Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ", "/profile"),
        };

        var menus = new[]
        {
            new Menu(7101, OneDeskAIAccessFormIds.Chat, null, 1, "Ø¯Ø³ØªÛŒØ§Ø± Ù‡ÙˆØ´Ù…Ù†Ø¯"),
            new Menu(7102, null, null, 2, "Ù…Ø¯ÛŒØ±ÛŒØª OneDeskAI"),
            new Menu(7103, OneDeskAIAccessFormIds.Admin, 7102, 1, "Ù…Ø±Ú©Ø² Ù…Ø¯ÛŒØ±ÛŒØª"),
            new Menu(7104, OneDeskAIAccessFormIds.Systems, 7102, 2, "Ø³Ø§Ù…Ø§Ù†Ù‡â€ŒÙ‡Ø§"),
            new Menu(7105, OneDeskAIAccessFormIds.DataSources, 7102, 3, "Ù…Ù†Ø§Ø¨Ø¹ Ø¯Ø§Ø¯Ù‡"),
            new Menu(7106, OneDeskAIAccessFormIds.Capabilities, 7102, 4, "Ù‚Ø§Ø¨Ù„ÛŒØªâ€ŒÙ‡Ø§ Ùˆ Ø§Ø¨Ø²Ø§Ø±Ù‡Ø§"),
            new Menu(7107, OneDeskAIAccessFormIds.Knowledge, 7102, 5, "Ø¯Ø§Ù†Ø´ Ø³Ø§Ø²Ù…Ø§Ù†ÛŒ"),
            new Menu(7108, OneDeskAIAccessFormIds.ActiveDirectory, 7102, 6, "Active Directory"),
            new Menu(7109, OneDeskAIAccessFormIds.Learning, 7102, 7, "ÛŒØ§Ø¯Ú¯ÛŒØ±ÛŒ Ùˆ Ø¨Ø§Ø²Ø®ÙˆØ±Ø¯"),
            new Menu(7110, OneDeskAIAccessFormIds.Platform, null, 3, "Ø³Ù„Ø§Ù…Øª Ù¾Ù„ØªÙØ±Ù…"),
            new Menu(7111, OneDeskAIAccessFormIds.Profile, null, 4, "Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ"),
        };

        if (systemAtId == null)
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                SET IDENTITY_INSERT [AccessSystem] ON;
                INSERT INTO [AccessSystem] ([AccessSystemId], [SystemName], [SystemTitle])
                VALUES ({OneDeskAIAccessFormIds.SystemId}, {OneDeskAIAccessFormIds.SystemName}, {OneDeskAIAccessFormIds.SystemTitle});
                SET IDENTITY_INSERT [AccessSystem] OFF;
                """);
        }

        var existingForms = await db.AccessForms
            .Where(x => x.AccessSystemId == OneDeskAIAccessFormIds.SystemId)
            .ToListAsync();
        foreach (var item in forms)
        {
            var existing = existingForms.FirstOrDefault(x => x.AccessFormId == item.Id);
            if (existing == null)
            {
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessForm] ON;
                    INSERT INTO [AccessForm] ([AccessFormId], [AccessSystemId], [FormTitle], [URL])
                    VALUES ({item.Id}, {OneDeskAIAccessFormIds.SystemId}, {item.Title}, {item.Url});
                    SET IDENTITY_INSERT [AccessForm] OFF;
                    """);
            }
            else
            {
                existing.FormTitle = item.Title;
                existing.URL = item.Url;
            }
        }

        var existingMenus = await db.AccessMenus
            .Where(x => x.AccessMenuId >= 7101 && x.AccessMenuId < 7200)
            .ToListAsync();
        foreach (var item in menus)
        {
            var existing = existingMenus.FirstOrDefault(x => x.AccessMenuId == item.Id);
            if (existing == null)
            {
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessMenu] ON;
                    INSERT INTO [AccessMenu] ([AccessMenuId], [AccessFormId], [ParentRef], [Order], [Title], [IsActive])
                    VALUES ({item.Id}, {item.FormId}, {item.ParentId}, {item.Order}, {item.Title}, {true});
                    SET IDENTITY_INSERT [AccessMenu] OFF;
                    """);
            }
            else
            {
                existing.AccessFormId = item.FormId;
                existing.ParentRef = item.ParentId;
                existing.Order = item.Order;
                existing.Title = item.Title;
                existing.IsActive = true;
            }
        }
        await db.SaveChangesAsync();

        var userRole = await EnsureSystemRole(roleManager, UserRole, "Ú©Ø§Ø±Ø¨Ø± OneDeskAI");
        var adminRole = await EnsureSystemRole(roleManager, AdminRole, "Ù…Ø¯ÛŒØ± OneDeskAI");
        await GrantRole(db, userRole, new[] { 7101, 7111 });
        await GrantRole(db, adminRole, menus.Select(x => x.Id));

        var globalAdmin = await roleManager.FindByNameAsync(ConstUserInfo.AdminRole);
        if (globalAdmin != null)
            await GrantRole(db, globalAdmin, menus.Select(x => x.Id));
    }

    private static async Task<ApplicationRole> EnsureSystemRole(
        RoleManager<ApplicationRole> roleManager,
        string name,
        string displayName)
    {
        var role = await roleManager.FindByNameAsync(name);
        if (role == null)
        {
            role = new ApplicationRole(name)
            {
                DisplayName = displayName,
                IsSystem = true,
                CreatedUtc = DateTime.UtcNow
            };
            var result = await roleManager.CreateAsync(role);
            if (!result.Succeeded)
                throw new InvalidOperationException($"Failed to create {name}: {string.Join(", ", result.Errors.Select(x => x.Description))}");
        }
        else
        {
            role.DisplayName = displayName;
            role.IsSystem = true;
            role.IsDeleted = false;
            var result = await roleManager.UpdateAsync(role);
            if (!result.Succeeded)
                throw new InvalidOperationException($"Failed to update {name}: {string.Join(", ", result.Errors.Select(x => x.Description))}");
        }
        return role;
    }

    private static async Task GrantRole(ApplicationDbContext db, ApplicationRole role, IEnumerable<int> menuIds)
    {
        if (!await db.AccessSystemRoles.AnyAsync(x => x.RoleId == role.Id && x.AccessSystemId == OneDeskAIAccessFormIds.SystemId))
            db.AccessSystemRoles.Add(new AccessSystemRole { RoleId = role.Id, AccessSystemId = OneDeskAIAccessFormIds.SystemId });

        var expected = menuIds.ToHashSet();
        var existing = await db.AccessRoles
            .Where(x => x.RoleId == role.Id && x.AccessMenuId >= 7101 && x.AccessMenuId < 7200)
            .ToListAsync();
        db.AccessRoles.RemoveRange(existing.Where(x => !expected.Contains(x.AccessMenuId)));
        foreach (var menuId in expected.Except(existing.Select(x => x.AccessMenuId)))
            db.AccessRoles.Add(new AccessRole { RoleId = role.Id, AccessMenuId = menuId, HasPersianAccess = true });
        await db.SaveChangesAsync();
    }
}
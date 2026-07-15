using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;

namespace IdentityServer.Domain.Data;

/// <summary>
/// Seed دسترسی داینامیک Healan — AccessSystem، AccessForm، AccessMenu، AccessSystemRole، AccessRole.
/// </summary>
public static class HealanAccessSeed
{
    private sealed record FormDef(int Id, string Title, string Url);
    private sealed record MenuDef(int Id, int? FormId, int? ParentId, int Order, string? Title = null);

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager)
    {
        await using (var transaction = await dbContext.Database.BeginTransactionAsync())
        {
            await EnsureSystemAsync(dbContext);
            await EnsureFormsAsync(dbContext);
            await EnsureMenusAsync(dbContext);
            await transaction.CommitAsync();
        }

        await EnsureSystemRolesAsync(dbContext, roleManager);
        await EnsureRolePermissionsAsync(dbContext, roleManager);
    }

    private static async Task EnsureSystemAsync(ApplicationDbContext dbContext)
    {
        if (await dbContext.AccessSystems.AnyAsync(s => s.AccessSystemId == HealanAccessFormIds.SystemId))
            return;

        await SetIdentityInsertAsync(dbContext, "AccessSystem", true);
        try
        {
            dbContext.AccessSystems.Add(new AccessSystem
            {
                AccessSystemId = HealanAccessFormIds.SystemId,
                SystemName = HealanAccessFormIds.SystemName,
                SystemTitle = HealanAccessFormIds.SystemTitle,
            });
            await dbContext.SaveChangesAsync();
        }
        finally
        {
            await SetIdentityInsertAsync(dbContext, "AccessSystem", false);
        }
    }

    private static async Task EnsureFormsAsync(ApplicationDbContext dbContext)
    {
        var forms = new[]
        {
            new FormDef(HealanAccessFormIds.Dashboard, "داشبورد", "/"),
            new FormDef(HealanAccessFormIds.Queue, "صف انتظار", "/queue"),
            new FormDef(HealanAccessFormIds.Appointments, "پذیرش و نوبت", "/appointments"),
            new FormDef(HealanAccessFormIds.Patients, "بیماران", "/patients"),
            new FormDef(HealanAccessFormIds.Doctors, "پزشکان", "/doctors"),
            new FormDef(HealanAccessFormIds.Prescriptions, "نسخه‌ها", "/prescriptions"),
            new FormDef(HealanAccessFormIds.Companies, "شرکت / مرکز درمانی", "/basic-data/companies"),
            new FormDef(HealanAccessFormIds.Insurance, "بیمه و قراردادها", "/basic-data/insurance"),
            new FormDef(HealanAccessFormIds.Services, "انواع خدمات", "/basic-data/services"),
            new FormDef(HealanAccessFormIds.MedicalFees, "تعرفه خدمات", "/basic-data/fees"),
            new FormDef(HealanAccessFormIds.UserDefine, "تعریف کاربر", "/basic-data/users"),
            new FormDef(HealanAccessFormIds.AccessDefine, "تعریف دسترسی", "/basic-data/access"),
            new FormDef(HealanAccessFormIds.AccessRoleAssign, "سطح دسترسی کاربر", "/basic-data/access-roles"),
            new FormDef(HealanAccessFormIds.Reports, "گزارش‌ها", "/reports"),
            new FormDef(HealanAccessFormIds.Workflow, "کارتابل", "/workflow"),
            new FormDef(HealanAccessFormIds.Signature, "امضای دیجیتال", "/signature"),
            new FormDef(HealanAccessFormIds.AccessAdmin, "مدیریت دسترسی‌ها", "/basic-data/access-roles"),
            new FormDef(HealanAccessFormIds.PortalContent, "محتوای سایت", "/site-content"),
            new FormDef(HealanAccessFormIds.PortalReviews, "نظرات بیماران", "/site-content/reviews"),
            new FormDef(HealanAccessFormIds.PortalBlog, "بلاگ — مشاهده", "/site-content/blog"),
            new FormDef(HealanAccessFormIds.PortalBlogAdd, "بلاگ — افزودن", "/site-content/blog/add"),
            new FormDef(HealanAccessFormIds.PortalBlogEdit, "بلاگ — ویرایش", "/site-content/blog/edit"),
            new FormDef(HealanAccessFormIds.PortalBlogDelete, "بلاگ — حذف", "/site-content/blog/delete"),
            new FormDef(HealanAccessFormIds.PortalBlogPublish, "بلاگ — نمایش/عدم نمایش", "/site-content/blog/publish"),
            new FormDef(HealanAccessFormIds.PortalRag, "ربات پاسخ‌گو — دانش پایه", "/site-content/rag"),
        };

        var formIds = forms.Select(f => f.Id).ToArray();
        var existingIds = await dbContext.AccessForms
            .Where(f => formIds.Contains(f.AccessFormId))
            .Select(f => f.AccessFormId)
            .ToListAsync();

        var pending = forms.Where(f => !existingIds.Contains(f.Id)).ToList();
        if (pending.Count == 0)
            return;

        await SetIdentityInsertAsync(dbContext, "AccessForm", true);
        try
        {
            foreach (var form in pending)
            {
                dbContext.AccessForms.Add(new AccessForm
                {
                    AccessFormId = form.Id,
                    AccessSystemId = HealanAccessFormIds.SystemId,
                    FormTitle = form.Title,
                    URL = form.Url,
                });
            }

            await dbContext.SaveChangesAsync();
        }
        finally
        {
            await SetIdentityInsertAsync(dbContext, "AccessForm", false);
        }
    }

    private static async Task EnsureMenusAsync(ApplicationDbContext dbContext)
    {
        var menus = new[]
        {
            new MenuDef(5101, HealanAccessFormIds.Dashboard, null, 1),
            new MenuDef(5102, null, null, 2, "مدیریت کلینیک"),
            new MenuDef(5103, HealanAccessFormIds.Queue, 5102, 1),
            new MenuDef(5104, HealanAccessFormIds.Appointments, 5102, 2),
            new MenuDef(5105, HealanAccessFormIds.Patients, 5102, 3),
            new MenuDef(5106, HealanAccessFormIds.Doctors, 5102, 4),
            new MenuDef(5107, HealanAccessFormIds.Prescriptions, 5102, 5),
            new MenuDef(5108, null, null, 3, "اطلاعات پایه"),
            // 5109 Companies (مرکز درمانی) removed from clinic menus — company still auto-assigned internally
            new MenuDef(5110, HealanAccessFormIds.Insurance, 5108, 1),
            new MenuDef(5111, HealanAccessFormIds.Services, 5108, 2),
            new MenuDef(5112, HealanAccessFormIds.MedicalFees, 5108, 3),
            new MenuDef(5113, null, 5108, 4, "مدیریت کاربران"),
            new MenuDef(5114, HealanAccessFormIds.UserDefine, 5113, 1),
            new MenuDef(5115, HealanAccessFormIds.AccessDefine, 5113, 2),
            new MenuDef(5116, HealanAccessFormIds.AccessRoleAssign, 5113, 3),
            new MenuDef(5117, HealanAccessFormIds.Reports, null, 4),
            new MenuDef(5118, HealanAccessFormIds.Workflow, null, 5),
            new MenuDef(5119, HealanAccessFormIds.Signature, null, 6),
            new MenuDef(5120, null, null, 7, "محتوای سایت"),
            new MenuDef(5121, HealanAccessFormIds.PortalContent, 5120, 1),
            new MenuDef(5122, HealanAccessFormIds.PortalReviews, 5120, 2),
            new MenuDef(5123, HealanAccessFormIds.PortalBlog, 5120, 3),
            new MenuDef(5124, HealanAccessFormIds.PortalBlogAdd, 5123, 1),
            new MenuDef(5125, HealanAccessFormIds.PortalBlogEdit, 5123, 2),
            new MenuDef(5126, HealanAccessFormIds.PortalBlogDelete, 5123, 3),
            new MenuDef(5127, HealanAccessFormIds.PortalBlogPublish, 5123, 4),
            new MenuDef(5128, HealanAccessFormIds.PortalRag, 5120, 4),
        };

        var menuIds = menus.Select(m => m.Id).ToArray();
        var existingIds = await dbContext.AccessMenus
            .Where(m => menuIds.Contains(m.AccessMenuId))
            .Select(m => m.AccessMenuId)
            .ToListAsync();

        var pending = menus.Where(m => !existingIds.Contains(m.Id)).ToList();
        if (pending.Count == 0)
            return;

        await SetIdentityInsertAsync(dbContext, "AccessMenu", true);
        try
        {
            foreach (var menu in pending)
            {
                dbContext.AccessMenus.Add(new AccessMenu
                {
                    AccessMenuId = menu.Id,
                    AccessFormId = menu.FormId,
                    ParentRef = menu.ParentId,
                    Order = menu.Order,
                });
            }

            await dbContext.SaveChangesAsync();
        }
        finally
        {
            await SetIdentityInsertAsync(dbContext, "AccessMenu", false);
        }
    }

    private static Task SetIdentityInsertAsync(ApplicationDbContext dbContext, string tableName, bool enabled)
    {
        var state = enabled ? "ON" : "OFF";
        return dbContext.Database.ExecuteSqlRawAsync($"SET IDENTITY_INSERT [{tableName}] {state}");
    }

    private static async Task EnsureSystemRolesAsync(
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager)
    {
        foreach (var roleName in HealanClinicAccess.ClinicSystemRoles)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role == null)
                continue;

            if (await dbContext.AccessSystemRoles.AnyAsync(r =>
                    r.RoleId == role.Id && r.AccessSystemId == HealanAccessFormIds.SystemId))
                continue;

            dbContext.AccessSystemRoles.Add(new AccessSystemRole
            {
                RoleId = role.Id,
                AccessSystemId = HealanAccessFormIds.SystemId,
            });
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureRolePermissionsAsync(
        ApplicationDbContext dbContext,
        RoleManager<ApplicationRole> roleManager)
    {
        // Admin gets every Healan menu (folders + leaves), including newly added ones.
        var allHealanMenuIds = await dbContext.AccessMenus
            .Where(m => m.AccessMenuId >= 5101 && m.AccessMenuId < 5200)
            .Select(m => m.AccessMenuId)
            .ToListAsync();

        var roleMenus = new Dictionary<string, int[]>
        {
            [ConstUserInfo.AdminRole] = allHealanMenuIds.ToArray(),
            [HealanClinicAccess.SecretaryRole] = HealanClinicAccess.SecretaryMenuIds,
            [HealanClinicAccess.DoctorRole] = HealanClinicAccess.DoctorMenuIds,
            [HealanClinicAccess.AccountantRole] = HealanClinicAccess.AccountantMenuIds,
        };

        foreach (var (roleName, menuIds) in roleMenus)
        {
            var role = await roleManager.FindByNameAsync(roleName);
            if (role == null)
                continue;

            await GrantMenusAsync(dbContext, role.Id, menuIds);
        }
    }

    private static async Task GrantMenusAsync(ApplicationDbContext dbContext, Guid roleId, IEnumerable<int> menuIds)
    {
        foreach (var menuId in menuIds)
        {
            if (await dbContext.AccessRoles.AnyAsync(r => r.RoleId == roleId && r.AccessMenuId == menuId))
                continue;

            dbContext.AccessRoles.Add(new AccessRole
            {
                RoleId = roleId,
                AccessMenuId = menuId,
                HasPersianAccess = true,
            });
        }

        await dbContext.SaveChangesAsync();
    }
}

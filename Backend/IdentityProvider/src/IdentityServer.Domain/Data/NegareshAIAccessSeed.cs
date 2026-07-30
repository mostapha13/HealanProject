using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Constants;

namespace IdentityServer.Domain.Data;

public static class NegareshAIAccessSeed
{
    private sealed record Form(int Id, string Title, string Url);
    private sealed record Menu(int Id, int? FormId, int? ParentId, int Order, string Title);

    public static async Task SeedAsync(ApplicationDbContext db, RoleManager<ApplicationRole> roleManager)
    {
        var forms = new[]
        {
            new Form(NegareshAIAccessFormIds.Dashboard, "داشبورد", "/"),
            new Form(NegareshAIAccessFormIds.Documents, "مدیریت اسناد", "/documents"),
            new Form(NegareshAIAccessFormIds.DocumentsCreate, "افزودن سند", "/documents/add"),
            new Form(NegareshAIAccessFormIds.DocumentsEdit, "ویرایش سند", "/documents/edit"),
            new Form(NegareshAIAccessFormIds.DocumentsDelete, "حذف سند", "/documents/delete"),
            new Form(NegareshAIAccessFormIds.Contracts, "مدیریت قراردادها", "/contracts"),
            new Form(NegareshAIAccessFormIds.ContractsCreate, "ثبت قرارداد", "/contracts/add"),
            new Form(NegareshAIAccessFormIds.ContractsEdit, "ویرایش قرارداد", "/contracts/edit"),
            new Form(NegareshAIAccessFormIds.ContractsDelete, "حذف قرارداد", "/contracts/delete"),
            new Form(NegareshAIAccessFormIds.Comparisons, "مقایسه اسناد", "/comparisons"),
            new Form(NegareshAIAccessFormIds.ContractGeneration, "تولید هوشمند قرارداد", "/contract-generation"),
            new Form(NegareshAIAccessFormIds.Knowledge, "دانش پایه", "/knowledge"),
            new Form(NegareshAIAccessFormIds.Reports, "گزارش‌ها", "/reports"),
            new Form(NegareshAIAccessFormIds.ContractStatuses, "وضعیت قرارداد", "/basic-data/statuses"),
            new Form(NegareshAIAccessFormIds.BaseDocuments, "سند مبنا", "/basic-data/base-documents"),
            new Form(NegareshAIAccessFormIds.ContractParties, "طرف‌های قرارداد", "/basic-data/parties"),
            new Form(NegareshAIAccessFormIds.OtherCatalogs, "سایر اطلاعات پایه", "/basic-data/catalogs"),
            new Form(NegareshAIAccessFormIds.Users, "کاربران", "/access/users"),
            new Form(NegareshAIAccessFormIds.Roles, "نقش‌ها", "/access/roles"),
            new Form(NegareshAIAccessFormIds.AccessDefinitions, "تعریف دسترسی‌ها", "/access/definitions"),
            new Form(NegareshAIAccessFormIds.RolePermissions, "دسترسی نقش‌ها", "/access/role-permissions"),
            new Form(NegareshAIAccessFormIds.UserPermissions, "دسترسی مستقیم کاربران", "/access/user-permissions"),
            new Form(NegareshAIAccessFormIds.RuntimeSettings, "تنظیمات سامانه", "/settings"),
            new Form(NegareshAIAccessFormIds.AuditLog, "تاریخچه تغییرات", "/audit"),
        };
        var menus = new[]
        {
            new Menu(6101, 6001, null, 1, "داشبورد"),
            new Menu(6102, null, null, 2, "مدیریت محتوا"),
            new Menu(6103, 6002, 6102, 1, "اسناد"),
            new Menu(6104, 6006, 6102, 2, "قراردادها"),
            new Menu(6105, 6010, 6102, 3, "مقایسه اسناد"),
            new Menu(6106, 6011, 6102, 4, "تولید هوشمند قرارداد"),
            new Menu(6107, 6012, 6102, 5, "دانش پایه"),
            new Menu(6108, 6013, null, 3, "گزارش‌ها"),
            new Menu(6109, null, null, 4, "اطلاعات پایه"),
            new Menu(6110, 6014, 6109, 1, "وضعیت قرارداد"),
            new Menu(6111, 6015, 6109, 2, "اسناد مبنا"),
            new Menu(6112, 6016, 6109, 3, "شرکت‌ها و طرف‌های قرارداد"),
            new Menu(6113, 6017, 6109, 4, "سایر اطلاعات پایه"),
            new Menu(6114, null, null, 5, "مدیریت کاربران و دسترسی"),
            new Menu(6115, 6018, 6114, 1, "کاربران"),
            new Menu(6116, 6019, 6114, 2, "نقش‌ها"),
            new Menu(6117, 6020, 6114, 3, "تعریف دسترسی‌ها"),
            new Menu(6118, 6021, 6114, 4, "دسترسی نقش‌ها"),
            new Menu(6119, 6022, 6114, 5, "دسترسی مستقیم کاربران"),
            new Menu(6120, 6023, null, 6, "تنظیمات سامانه"),
            new Menu(6121, 6024, null, 7, "تاریخچه تغییرات"),
            new Menu(6122, 6003, 6103, 101, "اسناد — افزودن"),
            new Menu(6123, 6004, 6103, 102, "اسناد — ویرایش"),
            new Menu(6124, 6005, 6103, 103, "اسناد — حذف"),
            new Menu(6125, 6007, 6104, 101, "قراردادها — افزودن"),
            new Menu(6126, 6008, 6104, 102, "قراردادها — ویرایش"),
            new Menu(6127, 6009, 6104, 103, "قراردادها — حذف"),
        };

        if (!await db.AccessSystems.AnyAsync(x => x.AccessSystemId == NegareshAIAccessFormIds.SystemId))
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                SET IDENTITY_INSERT [AccessSystem] ON;
                INSERT INTO [AccessSystem] ([AccessSystemId], [SystemName], [SystemTitle])
                VALUES ({NegareshAIAccessFormIds.SystemId}, {NegareshAIAccessFormIds.SystemName}, {NegareshAIAccessFormIds.SystemTitle});
                SET IDENTITY_INSERT [AccessSystem] OFF;
                """);
        }

        var existingForms = await db.AccessForms.Where(x => x.AccessSystemId == NegareshAIAccessFormIds.SystemId).ToListAsync();
        var missingForms = forms.Where(x => existingForms.All(e => e.AccessFormId != x.Id)).ToList();
        if (missingForms.Count > 0)
        {
            foreach (var item in missingForms)
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessForm] ON;
                    INSERT INTO [AccessForm] ([AccessFormId], [AccessSystemId], [FormTitle], [URL])
                    VALUES ({item.Id}, {NegareshAIAccessFormIds.SystemId}, {item.Title}, {item.Url});
                    SET IDENTITY_INSERT [AccessForm] OFF;
                    """);
        }
        foreach (var item in forms)
        {
            var row = existingForms.FirstOrDefault(x => x.AccessFormId == item.Id);
            if (row != null) { row.FormTitle = item.Title; row.URL = item.Url; }
        }

        var existingMenus = await db.AccessMenus.Where(x => x.AccessMenuId >= 6101 && x.AccessMenuId < 6200).ToListAsync();
        var missingMenus = menus.Where(x => existingMenus.All(e => e.AccessMenuId != x.Id)).ToList();
        if (missingMenus.Count > 0)
        {
            foreach (var item in missingMenus)
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    SET IDENTITY_INSERT [AccessMenu] ON;
                    INSERT INTO [AccessMenu] ([AccessMenuId], [AccessFormId], [ParentRef], [Order], [Title], [IsActive])
                    VALUES ({item.Id}, {item.FormId}, {item.ParentId}, {item.Order}, {item.Title}, {true});
                    SET IDENTITY_INSERT [AccessMenu] OFF;
                    """);
        }
        await db.SaveChangesAsync();

        var admin = await roleManager.FindByNameAsync(ConstUserInfo.AdminRole);
        if (admin == null) return;
        if (!await db.AccessSystemRoles.AnyAsync(x => x.RoleId == admin.Id && x.AccessSystemId == NegareshAIAccessFormIds.SystemId))
            db.AccessSystemRoles.Add(new AccessSystemRole { RoleId = admin.Id, AccessSystemId = NegareshAIAccessFormIds.SystemId });
        foreach (var menuId in menus.Select(x => x.Id))
            if (!await db.AccessRoles.AnyAsync(x => x.RoleId == admin.Id && x.AccessMenuId == menuId))
                db.AccessRoles.Add(new AccessRole { RoleId = admin.Id, AccessMenuId = menuId, HasPersianAccess = true });
        await db.SaveChangesAsync();
    }
}

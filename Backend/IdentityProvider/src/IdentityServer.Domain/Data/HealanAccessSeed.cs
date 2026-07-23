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
            await EnsureMenuLayoutAsync(dbContext);
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
            new FormDef(HealanAccessFormIds.Reports, "نمودارها و آمارها", "/reports"),
            new FormDef(HealanAccessFormIds.Workflow, "کارتابل", "/workflow"),
            new FormDef(HealanAccessFormIds.Signature, "امضای دیجیتال", "/signature"),
            new FormDef(HealanAccessFormIds.AccessAdmin, "مدیریت دسترسی‌ها", "/basic-data/access-roles"),
            new FormDef(HealanAccessFormIds.PortalContent, "بخش‌ها و مطالب", "/site-content"),
            new FormDef(HealanAccessFormIds.PortalSiteSettings, "تنظیمات سایت", "/site-content/settings"),
            new FormDef(HealanAccessFormIds.PortalSeo, "تنظیمات SEO", "/site-content/seo"),
            new FormDef(HealanAccessFormIds.PortalReviews, "نظرات بیماران", "/site-content/reviews"),
            new FormDef(HealanAccessFormIds.PortalBlog, "بلاگ — مشاهده", "/site-content/blog"),
            new FormDef(HealanAccessFormIds.PortalBlogAdd, "بلاگ — افزودن", "/site-content/blog/add"),
            new FormDef(HealanAccessFormIds.PortalBlogEdit, "بلاگ — ویرایش", "/site-content/blog/edit"),
            new FormDef(HealanAccessFormIds.PortalBlogDelete, "بلاگ — حذف", "/site-content/blog/delete"),
            new FormDef(HealanAccessFormIds.PortalBlogPublish, "بلاگ — نمایش/عدم نمایش", "/site-content/blog/publish"),
            new FormDef(HealanAccessFormIds.PortalRag, "ربات پاسخ‌گو — دانش پایه", "/site-content/rag"),
            new FormDef(HealanAccessFormIds.SmsOutbox, "پیامک‌های ارسالی", "/reports/sms"),
            new FormDef(HealanAccessFormIds.SmsSettings, "تنظیمات پیامک", "/reports/sms-settings"),
            new FormDef(HealanAccessFormIds.AssistantSettings, "تنظیمات دستیار هوشمند", "/basic-data/assistant"),
            new FormDef(HealanAccessFormIds.PortalRagLogs, "گفتگوهای دستیار", "/site-content/rag-logs"),
            new FormDef(HealanAccessFormIds.BookingSchedules, "برنامه حضور", "/booking/schedules"),
            new FormDef(HealanAccessFormIds.BookingReservations, "رزروهای نوبت", "/booking/reservations"),
            new FormDef(HealanAccessFormIds.PatientHistory, "سوابق بیمار", "/patient/history"),
            new FormDef(HealanAccessFormIds.PatientBloodPressure, "ثبت فشار خون", "/patient/blood-pressure"),
            new FormDef(HealanAccessFormIds.PatientMedications, "یادآوری داروها", "/patient/medications"),
            new FormDef(HealanAccessFormIds.PatientAssistant, "چت‌بات بیمار", "/assistant"),
            new FormDef(HealanAccessFormIds.PatientBooking, "رزرو نوبت بیمار", "/booking"),
            new FormDef(HealanAccessFormIds.ClinicBloodPressure, "فشار خون", "/blood-pressure"),
        };

        var formIds = forms.Select(f => f.Id).ToArray();
        var existing = await dbContext.AccessForms
            .Where(f => formIds.Contains(f.AccessFormId))
            .ToListAsync();
        var existingIds = existing.Select(f => f.AccessFormId).ToHashSet();

        foreach (var form in forms)
        {
            var row = existing.FirstOrDefault(f => f.AccessFormId == form.Id);
            if (row == null)
                continue;
            if (row.FormTitle != form.Title || row.URL != form.Url)
            {
                row.FormTitle = form.Title;
                row.URL = form.Url;
            }
        }

        var pending = forms.Where(f => !existingIds.Contains(f.Id)).ToList();
        if (pending.Count == 0)
        {
            await dbContext.SaveChangesAsync();
            return;
        }

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
            new MenuDef(5101, HealanAccessFormIds.Dashboard, null, 1, "داشبورد"),
            new MenuDef(5102, null, null, 2, "مدیریت کلینیک"),
            new MenuDef(5103, HealanAccessFormIds.Queue, 5102, 1, "صف انتظار"),
            new MenuDef(5104, HealanAccessFormIds.Appointments, 5102, 2, "پذیرش و نوبت"),
            new MenuDef(5105, HealanAccessFormIds.Patients, 5102, 3, "بیماران"),
            new MenuDef(5142, HealanAccessFormIds.ClinicBloodPressure, 5102, 4, "فشار خون"),
            new MenuDef(5106, HealanAccessFormIds.Doctors, 5102, 5, "پزشکان"),
            new MenuDef(5107, HealanAccessFormIds.Prescriptions, 5102, 6, "نسخه‌ها"),
            new MenuDef(5133, null, null, 3, "نوبت‌دهی"),
            new MenuDef(5134, HealanAccessFormIds.BookingSchedules, 5133, 1, "برنامه حضور"),
            new MenuDef(5135, HealanAccessFormIds.BookingReservations, 5133, 2, "رزروهای نوبت"),
            new MenuDef(5108, null, null, 4, "اطلاعات پایه"),
            new MenuDef(5109, HealanAccessFormIds.Companies, 5108, 1, "شرکت / مرکز درمانی"),
            new MenuDef(5110, HealanAccessFormIds.Insurance, 5108, 2, "بیمه و قراردادها"),
            new MenuDef(5111, HealanAccessFormIds.Services, 5108, 3, "انواع خدمات"),
            new MenuDef(5112, HealanAccessFormIds.MedicalFees, 5108, 4, "تعرفه خدمات"),
            new MenuDef(5131, HealanAccessFormIds.AssistantSettings, 5108, 5, "تنظیمات دستیار هوشمند"),
            new MenuDef(5113, null, 5108, 6, "مدیریت کاربران"),
            new MenuDef(5114, HealanAccessFormIds.UserDefine, 5113, 1, "تعریف کاربر"),
            new MenuDef(5115, HealanAccessFormIds.AccessDefine, 5113, 2, "تعریف دسترسی‌ها"),
            new MenuDef(5116, HealanAccessFormIds.AccessRoleAssign, 5113, 3, "سطح دسترسی نقش‌ها"),
            new MenuDef(5120, null, null, 5, "محتوای سایت"),
            new MenuDef(5121, HealanAccessFormIds.PortalContent, 5120, 1, "بخش‌ها و مطالب"),
            new MenuDef(5145, HealanAccessFormIds.PortalSiteSettings, 5120, 2, "تنظیمات سایت"),
            new MenuDef(5146, HealanAccessFormIds.PortalSeo, 5120, 3, "تنظیمات SEO"),
            new MenuDef(5122, HealanAccessFormIds.PortalReviews, 5120, 4, "نظرات بیماران"),
            new MenuDef(5123, HealanAccessFormIds.PortalBlog, 5120, 5, "بلاگ"),
            new MenuDef(5124, HealanAccessFormIds.PortalBlogAdd, 5123, 1, "بلاگ — افزودن"),
            new MenuDef(5125, HealanAccessFormIds.PortalBlogEdit, 5123, 2, "بلاگ — ویرایش"),
            new MenuDef(5126, HealanAccessFormIds.PortalBlogDelete, 5123, 3, "بلاگ — حذف"),
            new MenuDef(5127, HealanAccessFormIds.PortalBlogPublish, 5123, 4, "بلاگ — نمایش/عدم نمایش"),
            new MenuDef(5128, HealanAccessFormIds.PortalRag, 5120, 6, "دانش پایه ربات"),
            new MenuDef(5132, HealanAccessFormIds.PortalRagLogs, 5120, 7, "گفتگوهای دستیار"),
            new MenuDef(5144, null, null, 6, "گزارش‌ها"),
            new MenuDef(5117, HealanAccessFormIds.Reports, 5144, 1, "نمودارها و آمارها"),
            new MenuDef(5143, null, null, 7, "مدیریت پیامک"),
            new MenuDef(5129, HealanAccessFormIds.SmsOutbox, 5143, 1, "پیامک‌های ارسالی"),
            new MenuDef(5130, HealanAccessFormIds.SmsSettings, 5143, 2, "تنظیمات پیامک"),
            new MenuDef(5119, HealanAccessFormIds.Signature, null, 8, "امضای دیجیتال"),
            new MenuDef(5118, HealanAccessFormIds.Workflow, null, 9, "کارتابل"),
            new MenuDef(5136, null, null, 10, "ناحیه بیمار (سایت)"),
            new MenuDef(5137, HealanAccessFormIds.PatientHistory, 5136, 1, "سوابق بیمار"),
            new MenuDef(5138, HealanAccessFormIds.PatientBloodPressure, 5136, 2, "ثبت فشار خون"),
            new MenuDef(5139, HealanAccessFormIds.PatientMedications, 5136, 3, "یادآوری داروها"),
            new MenuDef(5140, HealanAccessFormIds.PatientAssistant, 5136, 4, "چت‌بات بیمار"),
            new MenuDef(5141, HealanAccessFormIds.PatientBooking, 5136, 5, "رزرو نوبت بیمار"),
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
                    Title = menu.Title,
                    IsActive = true,
                });
            }

            await dbContext.SaveChangesAsync();
        }
        finally
        {
            await SetIdentityInsertAsync(dbContext, "AccessMenu", false);
        }
    }

    /// <summary>
    /// Re-parent / retitle existing Healan menus so production DBs pick up layout changes.
    /// </summary>
    private static async Task EnsureMenuLayoutAsync(ApplicationDbContext dbContext)
    {
        var desired = new Dictionary<int, (int? Parent, int Order, string Title, int? FormId)>
        {
            [5101] = (null, 1, "داشبورد", HealanAccessFormIds.Dashboard),
            [5102] = (null, 2, "مدیریت کلینیک", null),
            [5103] = (5102, 1, "صف انتظار", HealanAccessFormIds.Queue),
            [5104] = (5102, 2, "پذیرش و نوبت", HealanAccessFormIds.Appointments),
            [5105] = (5102, 3, "بیماران", HealanAccessFormIds.Patients),
            [5142] = (5102, 4, "فشار خون", HealanAccessFormIds.ClinicBloodPressure),
            [5106] = (5102, 5, "پزشکان", HealanAccessFormIds.Doctors),
            [5107] = (5102, 6, "نسخه‌ها", HealanAccessFormIds.Prescriptions),
            [5133] = (null, 3, "نوبت‌دهی", null),
            [5134] = (5133, 1, "برنامه حضور", HealanAccessFormIds.BookingSchedules),
            [5135] = (5133, 2, "رزروهای نوبت", HealanAccessFormIds.BookingReservations),
            [5108] = (null, 4, "اطلاعات پایه", null),
            [5109] = (5108, 1, "شرکت / مرکز درمانی", HealanAccessFormIds.Companies),
            [5110] = (5108, 2, "بیمه و قراردادها", HealanAccessFormIds.Insurance),
            [5111] = (5108, 3, "انواع خدمات", HealanAccessFormIds.Services),
            [5112] = (5108, 4, "تعرفه خدمات", HealanAccessFormIds.MedicalFees),
            [5131] = (5108, 5, "تنظیمات دستیار هوشمند", HealanAccessFormIds.AssistantSettings),
            [5113] = (5108, 6, "مدیریت کاربران", null),
            [5114] = (5113, 1, "تعریف کاربر", HealanAccessFormIds.UserDefine),
            [5115] = (5113, 2, "تعریف دسترسی‌ها", HealanAccessFormIds.AccessDefine),
            [5116] = (5113, 3, "سطح دسترسی نقش‌ها", HealanAccessFormIds.AccessRoleAssign),
            [5120] = (null, 5, "محتوای سایت", null),
            [5121] = (5120, 1, "بخش‌ها و مطالب", HealanAccessFormIds.PortalContent),
            [5145] = (5120, 2, "تنظیمات سایت", HealanAccessFormIds.PortalSiteSettings),
            [5146] = (5120, 3, "تنظیمات SEO", HealanAccessFormIds.PortalSeo),
            [5122] = (5120, 4, "نظرات بیماران", HealanAccessFormIds.PortalReviews),
            [5123] = (5120, 5, "بلاگ", HealanAccessFormIds.PortalBlog),
            [5124] = (5123, 1, "بلاگ — افزودن", HealanAccessFormIds.PortalBlogAdd),
            [5125] = (5123, 2, "بلاگ — ویرایش", HealanAccessFormIds.PortalBlogEdit),
            [5126] = (5123, 3, "بلاگ — حذف", HealanAccessFormIds.PortalBlogDelete),
            [5127] = (5123, 4, "بلاگ — نمایش/عدم نمایش", HealanAccessFormIds.PortalBlogPublish),
            [5128] = (5120, 6, "دانش پایه ربات", HealanAccessFormIds.PortalRag),
            [5132] = (5120, 7, "گفتگوهای دستیار", HealanAccessFormIds.PortalRagLogs),
            [5144] = (null, 6, "گزارش‌ها", null),
            [5117] = (5144, 1, "نمودارها و آمارها", HealanAccessFormIds.Reports),
            [5143] = (null, 7, "مدیریت پیامک", null),
            [5129] = (5143, 1, "پیامک‌های ارسالی", HealanAccessFormIds.SmsOutbox),
            [5130] = (5143, 2, "تنظیمات پیامک", HealanAccessFormIds.SmsSettings),
            [5119] = (null, 8, "امضای دیجیتال", HealanAccessFormIds.Signature),
            [5118] = (null, 9, "کارتابل", HealanAccessFormIds.Workflow),
            [5136] = (null, 10, "ناحیه بیمار (سایت)", null),
            [5137] = (5136, 1, "سوابق بیمار", HealanAccessFormIds.PatientHistory),
            [5138] = (5136, 2, "ثبت فشار خون", HealanAccessFormIds.PatientBloodPressure),
            [5139] = (5136, 3, "یادآوری داروها", HealanAccessFormIds.PatientMedications),
            [5140] = (5136, 4, "چت‌بات بیمار", HealanAccessFormIds.PatientAssistant),
            [5141] = (5136, 5, "رزرو نوبت بیمار", HealanAccessFormIds.PatientBooking),
        };

        var ids = desired.Keys.ToArray();
        var existing = await dbContext.AccessMenus
            .Where(m => ids.Contains(m.AccessMenuId))
            .ToListAsync();

        // Ensure any newly added menus (folders + leaves) exist on production DBs.
        var missingMenus = desired
            .Where(kv => existing.All(e => e.AccessMenuId != kv.Key))
            .ToList();
        if (missingMenus.Count > 0)
        {
            await SetIdentityInsertAsync(dbContext, "AccessMenu", true);
            try
            {
                foreach (var menu in missingMenus)
                {
                    dbContext.AccessMenus.Add(new AccessMenu
                    {
                        AccessMenuId = menu.Key,
                        AccessFormId = menu.Value.FormId,
                        ParentRef = menu.Value.Parent,
                        Order = menu.Value.Order,
                        Title = menu.Value.Title,
                        IsActive = true,
                    });
                }
                await dbContext.SaveChangesAsync();
            }
            finally
            {
                await SetIdentityInsertAsync(dbContext, "AccessMenu", false);
            }

            existing = await dbContext.AccessMenus
                .Where(m => ids.Contains(m.AccessMenuId))
                .ToListAsync();
        }

        var reportsForm = await dbContext.AccessForms
            .FirstOrDefaultAsync(f => f.AccessFormId == HealanAccessFormIds.Reports);
        if (reportsForm != null && reportsForm.FormTitle != "نمودارها و آمارها")
            reportsForm.FormTitle = "نمودارها و آمارها";

        foreach (var menu in existing)
        {
            if (!desired.TryGetValue(menu.AccessMenuId, out var layout))
                continue;
            menu.ParentRef = layout.Parent;
            menu.Order = layout.Order;
            menu.Title = layout.Title;
            if (layout.FormId.HasValue)
                menu.AccessFormId = layout.FormId;
            menu.IsActive = true;
        }

        await dbContext.SaveChangesAsync();
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
            [HealanClinicAccess.ContentProducerRole] = HealanClinicAccess.ContentProducerMenuIds,
            [HealanClinicAccess.PatientRole] = HealanClinicAccess.PatientPortalMenuIds,
            [HealanClinicAccess.SiteUserRole] = HealanClinicAccess.PatientPortalMenuIds,
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

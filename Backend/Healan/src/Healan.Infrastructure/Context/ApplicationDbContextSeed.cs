using Healan.Domain.Companies.Entities;
using Healan.Domain.Companies.Enums;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Insurances.Enums;
using Healan.Domain.MedicalFeeServices.Entities;
using Healan.Domain.MedicalFeeServices.Enums;
using Healan.Domain.Menus.Entities;
using Healan.Domain.Menus.Enums;
using Healan.Domain.PublicInfos.Entities;
using Healan.Domain.Users.Entities;
using Healan.Domain.Users.Enums;
using Healan.Infrastructure.Portal;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Entities;
using Share.Domain.Enums;
using Share.Domain.Extensions;

namespace Healan.Infrastructure.Context;

/// <summary>
/// داده‌های اولیه و نمونه Healan — idempotent و قابل اجرای مجدد.
/// </summary>
public static class ApplicationDbContextSeed
{
    /// <summary>شناسه سیستمی برای رکوردهای seed (بدون کاربر واقعی).</summary>
    private static readonly Guid SystemUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await SeedLookupTablesAsync(context);
        await SeedDefaultCompanyAsync(context);

        var (services, insurances) = TryLoadDoctorExcel();
        await SeedServiceTypesAsync(context, services);
        await SeedInsuranceDataAsync(context, insurances);
        await SeedMenusAsync(context);
        await PortalContentSeed.SeedAsync(context);
        await context.SaveChangesAsync();
    }

    private static (List<DoctorExcelSeedLoader.ServiceSeedRow> Services, List<DoctorExcelSeedLoader.InsuranceSeedRow> Insurances) TryLoadDoctorExcel()
    {
        try
        {
            return DoctorExcelSeedLoader.LoadSeedData();
        }
        catch (FileNotFoundException)
        {
            return ([], []);
        }
    }

    /// <summary>سازگاری با نام قبلی.</summary>
    public static Task SeedSamplePostAsync(ApplicationDbContext context) => SeedAsync(context);

    private static async Task SeedLookupTablesAsync(ApplicationDbContext context)
    {
        AddEnumInDataBase<CompanyRegistrationTypeId, CompanyRegistrationType>(context);
        AddEnumInDataBase<InsuranceTypeId, InsuranceType>(context);
        AddEnumInDataBase<CategoryTypeId, CategoryType>(context);
        AddEnumInDataBase<UserTypeId, UserType>(context);
        await context.SaveChangesAsync();
    }

    /// <summary>مرکز درمانی پیش‌فرض برای نصب اولیه.</summary>
    private static async Task SeedDefaultCompanyAsync(ApplicationDbContext context)
    {
        if (await context.Companies.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        context.Companies.Add(new Company
        {
            CompanyName = "کلینیک نمونه هیلان",
            LatinCompanyName = "Healan Sample Clinic",
            EstablishmentDate = new DateTime(2020, 1, 1),
            CompanyRegistrationTypeId = CompanyRegistrationTypeId.Clinic,
            NationalId = "14001234567",
            WebSite = "https://healan.ir",
            Email = "info@healan.ir",
            RegistrationNumber = "123456",
            RegistrationDate = new DateTime(2020, 1, 15),
            Landline = "021",
            PrefixNumber = "88776655",
            Address = "تهران، خیابان ولیعصر، پلاک ۱۰۰",
            CategoryNumber = 1,
            CreatedBy = SystemUserId,
            CreatedAt = now,
            DepartmentId = DepartmentId.Healan,
            IsDeleted = false,
        });
    }

    /// <summary>انواع خدمات و تعرفه‌های پایه — از Docs/Doctor.xlsx.</summary>
    private static async Task SeedServiceTypesAsync(
        ApplicationDbContext context,
        IReadOnlyList<DoctorExcelSeedLoader.ServiceSeedRow> services)
    {
        if (services.Count == 0)
            return;

        var now = DateTime.UtcNow;
        var feeStart = new DateTime(now.Year, 1, 1);
        var feeEnd = new DateTime(now.Year, 12, 31);
        var existingCodes = await context.ServiceTypes
            .Where(s => s.Code != null)
            .Select(s => s.Code!)
            .ToListAsync();

        foreach (var item in services)
        {
            if (existingCodes.Contains(item.Code))
                continue;

            var serviceType = new ServiceType
            {
                Title = item.Title,
                Code = item.Code,
                CategoryTypeId = item.Category,
                Description = item.Description,
            };
            context.ServiceTypes.Add(serviceType);
            await context.SaveChangesAsync();
            existingCodes.Add(item.Code);

            context.MedicalFeeServices.Add(new MedicalFeeService
            {
                ServiceTypeId = serviceType.ServiceTypeId,
                StartDate = feeStart,
                EndDate = feeEnd,
                IsActive = true,
                Price = item.Price,
                CreatedBy = SystemUserId,
                CreatedAt = now,
                DepartmentId = DepartmentId.Healan,
                IsDeleted = false,
            });
        }
    }

    /// <summary>شرکت‌های بیمه از Docs/Doctor.xlsx — تامین اجتماعی، سلامت، نیرو مسلح، آزاد.</summary>
    private static async Task SeedInsuranceDataAsync(
        ApplicationDbContext context,
        IReadOnlyList<DoctorExcelSeedLoader.InsuranceSeedRow> companies)
    {
        if (companies.Count == 0)
            return;

        var now = DateTime.UtcNow;
        var contractStart = new DateTime(now.Year, 1, 1);
        var contractEnd = new DateTime(now.Year, 12, 31);

        var existingCodes = await context.InsuranceCompanies
            .Where(c => c.Code != null)
            .Select(c => c.Code!)
            .ToListAsync();

        foreach (var companyInfo in companies)
        {
            if (existingCodes.Contains(companyInfo.Code))
                continue;

            var company = new InsuranceCompany
            {
                Name = companyInfo.Name,
                Code = companyInfo.Code,
                InsuranceTypeId = companyInfo.InsuranceType,
                PhoneNumber = "021-88888888",
                CreatedBy = SystemUserId,
                CreatedAt = now,
                DepartmentId = DepartmentId.Healan,
                IsDeleted = false,
            };
            context.InsuranceCompanies.Add(company);
            await context.SaveChangesAsync();
            existingCodes.Add(companyInfo.Code);

            if (companyInfo.InsuranceType == InsuranceTypeId.None)
                continue;

            var contract = new InsuranceContract
            {
                InsuranceCompanyId = company.InsuranceCompanyId,
                ContractNumber = $"CNT-{companyInfo.Code}-{now.Year}",
                StartDate = contractStart,
                EndDate = contractEnd,
                PhoneNumber = "021-88888888",
                EmailAddress = "contract@healan.ir",
                IsActive = true,
                CreatedBy = SystemUserId,
                CreatedAt = now,
                DepartmentId = DepartmentId.Healan,
                IsDeleted = false,
            };
            context.InsuranceContracts.Add(contract);
            await context.SaveChangesAsync();

            var serviceTypes = await context.ServiceTypes.ToListAsync();
            foreach (var service in serviceTypes)
            {
                var fee = await context.MedicalFeeServices
                    .Where(m => m.ServiceTypeId == service.ServiceTypeId && m.IsActive)
                    .OrderByDescending(m => m.StartDate)
                    .FirstOrDefaultAsync();

                var basePrice = fee?.Price ?? 300_000;
                var coverage = companyInfo.InsuranceType == InsuranceTypeId.Primary ? 70m : 50m;

                context.InsuranceContractServices.Add(new InsuranceContractService
                {
                    InsuranceContractId = contract.InsuranceContractId,
                    ServiceTypeId = service.ServiceTypeId,
                    CoveragePercentage = coverage,
                    FinalPrice = basePrice,
                    CoPayment = Math.Round(basePrice * (100 - coverage) / 100m, 0),
                    EffectiveFrom = contractStart,
                    EffectiveTo = contractEnd,
                    CreatedBy = SystemUserId,
                    CreatedAt = now,
                    DepartmentId = DepartmentId.Healan,
                    IsDeleted = false,
                });
            }
        }
    }

    /// <summary>منوی اصلی UI کلینیک.</summary>
    private static async Task SeedMenusAsync(ApplicationDbContext context)
    {
        if (await context.Menus.AnyAsync())
            return;

        var dashboardMenu = new Menu
        {
            MenuTitle = "داشبورد",
            MenuWeight = 1,
            HealanTypeId = HealanTypeId.HealanAcceptance,
        };
        context.Menus.Add(dashboardMenu);

        var clinicMenu = new Menu
        {
            MenuTitle = "مدیریت کلینیک",
            MenuWeight = 2,
            HealanTypeId = HealanTypeId.HealanAcceptance,
        };
        context.Menus.Add(clinicMenu);

        var basicDataMenu = new Menu
        {
            MenuTitle = "اطلاعات پایه",
            MenuWeight = 3,
            HealanTypeId = HealanTypeId.HealanAcceptance,
        };
        context.Menus.Add(basicDataMenu);

        await context.SaveChangesAsync();

        var submenus = new (Menu Menu, int Row, string Title, int Weight, string Component)[]
        {
            (dashboardMenu, 1, "داشبورد", 1, "HealanDashboard"),
            (clinicMenu, 1, "صف انتظار", 1, "HealanQueue"),
            (clinicMenu, 2, "پذیرش و نوبت", 2, "HealanAppointment"),
            (clinicMenu, 3, "بیماران", 3, "HealanPatients"),
            (clinicMenu, 4, "پزشکان", 4, "HealanDoctors"),
            (clinicMenu, 5, "نسخه و دستورات", 5, "HealanPrescription"),
            (basicDataMenu, 1, "بیمه و قراردادها", 1, "HealanInsurance"),
            (basicDataMenu, 2, "تعرفه خدمات", 2, "HealanMedicalFee"),
            (basicDataMenu, 3, "انواع خدمات", 3, "HealanServiceTypes"),
            (basicDataMenu, 4, "شرکت / مرکز درمانی", 4, "HealanCompany"),
            (basicDataMenu, 5, "کاربران", 5, "HealanUsers"),
        };

        foreach (var item in submenus)
        {
            context.Submenus.Add(new Submenu
            {
                MenuId = item.Menu.MenuId,
                SubmenuRow = item.Row,
                SubmenuTitle = item.Title,
                SubmenuWeight = item.Weight,
                HasSignature = false,
                ComponentName = item.Component,
                SaveApiName = string.Empty,
                FindApiName = string.Empty,
                ConfirmApiName = string.Empty,
                RejectApiName = string.Empty,
                Label = new Dictionary<string, string>(),
            });
        }
    }

    private static void AddEnumInDataBase<TEnum, TEntity>(ApplicationDbContext context)
        where TEnum : Enum
        where TEntity : class, IEnumKey, new()
    {
        var enumItems = EnumExtensions.GetEnumInfo<TEnum>();
        if (context.Set<TEntity>().Count() == enumItems.Count)
            return;

        var existing = context.Set<TEntity>().ToList();
        foreach (var item in enumItems)
        {
            var key = (byte)item.Key;
            if (existing.Any(a => a.Key == key))
                continue;

            var entity = new TEntity();
            entity.SetValues(key, item.DisplayName ?? item.Name);
            context.Set<TEntity>().Add(entity);
        }
    }
}

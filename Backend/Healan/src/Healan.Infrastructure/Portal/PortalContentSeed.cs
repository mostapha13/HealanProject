using Healan.Domain.Portal.Entities;
using Healan.Domain.Portal.Enums;
using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Healan.Infrastructure.Portal;

public static class PortalContentSeed
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await SeedSettingsAsync(context);
        await SeedContentAsync(context);
        await SeedHeroSlidesIfMissingAsync(context);
        await SeedHeroStatsIfMissingAsync(context);
        await context.SaveChangesAsync();
    }

    private static async Task SeedSettingsAsync(ApplicationDbContext context)
    {
        var defaults = new (string Key, string Value, string Group, string Description)[]
        {
            ("doctor.name", "دکتر معصومه شهرویی", "doctor", "نام کامل پزشک"),
            ("doctor.shortName", "معصومه شهرویی", "doctor", "نام کوتاه"),
            ("doctor.specialty", "متخصص قلب و عروق", "doctor", "تخصص"),
            ("doctor.board", "فارغ‌التحصیل و دارای بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی تهران", "doctor", "بورد تخصصی"),
            ("doctor.general", "فارغ‌التحصیل مقطع عمومی از دانشگاه علوم پزشکی تهران", "doctor", "تحصیلات عمومی"),
            ("contact.address", "شوشتر، خیابان طالقانی، پایین‌تر از خیابان سادات، ساختمان پزشکان دکتر جلالی (آزمایشگاه سلامت)، طبقه دوم، واحد ۲", "contact", "آدرس مطب"),
            ("contact.city", "شوشتر", "contact", "شهر"),
            ("contact.phone", "09025103867", "contact", "تلفن"),
            ("contact.phoneDisplay", "۰۹۰۲۵۱۰۳۸۶۷", "contact", "نمایش تلفن"),
            ("contact.hours", "شنبه تا چهارشنبه ۹ تا ۱۳ و ۱۶ تا ۲۰", "contact", "ساعات کاری"),
            ("site.topbar", "مطب تخصصی قلب و عروق · شوشتر", "site", "نوار بالای سایت"),
            ("about.quote", "سلامت قلب شما، اولویت ماست.", "about", "جمله درباره پزشک"),
            ("hero.pill", "مراقبت تخصصی از قلب شما", "hero", "برچسب هیرو"),
            ("hero.description", "با بورد تخصصی از بیمارستان فوق‌تخصصی شهید رجایی و تحصیلات دانشگاه علوم پزشکی تهران، خدمات تشخیصی و درمانی استاندارد قلب و عروق را در شوشتر ارائه می‌دهیم.", "hero", "توضیح هیرو"),
            ("hero.float.title", "قلب و عروق", "hero", "کارت شناور — عنوان"),
            ("hero.float.subtitle", "تشخیص · درمان · پیشگیری", "hero", "کارت شناور — زیرعنوان"),
            ("section.about.badge", "درباره پزشک", "section", "برچسب بخش درباره"),
            ("section.about.title", "پزشکی دقیق، همراهی صمیمانه", "section", "عنوان بخش درباره"),
            ("section.about.p1", "دکتر معصومه شهرویی با رویکردی مبتنی بر شواهد علمی، برای هر بیمار زمان کافی برای شنیدن علائم، توضیح وضعیت و طراحی برنامه درمانی اختصاص می‌دهد.", "section", "پاراگراف اول درباره"),
            ("section.about.p2", "هدف این مطب، ارائه خدمات قلب و عروق در سطح استانداردهای دانشگاهی، در فضایی آرام و قابل‌اعتماد برای ساکنان شوشتر و شهرستان‌های اطراف است.", "section", "پاراگراف دوم درباره"),
            ("section.why.title", "چرا مطب دکتر شهرویی؟", "section", "عنوان بخش چرا این مطب"),
            ("section.why.subtitle", "تجربه‌ای شبیه سایت‌های حرفه‌ای — شفاف، سریع و قابل اعتماد", "section", "زیرعنوان بخش چرا این مطب"),
            ("section.services.title", "خدمات تخصصی قلب و عروق", "section", "عنوان بخش خدمات"),
            ("section.services.subtitle", "پوشش کامل نیازهای تشخیصی و درمانی — مرتب و دسته‌بندی‌شده", "section", "زیرعنوان بخش خدمات"),
            ("section.reviews.title", "نظرات بیماران", "section", "عنوان بخش نظرات"),
            ("section.reviews.subtitle", "تجربه واقعی مراجعین — پس از تأیید مدیر در سایت نمایش داده می‌شود", "section", "زیرعنوان بخش نظرات"),
            ("section.contact.title", "تماس و آدرس مطب", "section", "عنوان بخش تماس"),
            ("section.contact.lead", "برای رزرو نوبت تماس بگیرید یا به مطب مراجعه کنید.", "section", "متن راهنمای تماس"),
            ("section.contact.hint", "پرسنل، پزشک و بیماران پس از ورود، بر اساس نقش کاربری به بخش‌های مربوط در سامانه Healan دسترسی دارند.", "section", "راهنمای ورود به سامانه"),
            ("map.header", "شوشتر — خیابان طالقانی", "map", "عنوان کارت نقشه"),
            ("map.building", "ساختمان پزشکان دکتر جلالی", "map", "نام ساختمان"),
            ("map.detail", "آزمایشگاه سلامت · طبقه ۲ · واحد ۲", "map", "جزئیات آدرس"),
            ("map.link", "https://www.google.com/maps/search/Shushtar+Taleghani", "map", "لینک نقشه"),
            ("section.enabled.HeroSlide", "true", "section", "نمایش اسلایدر هیرو"),
            ("section.enabled.HeroStat", "true", "section", "نمایش آمار هیرو"),
            ("section.enabled.TrustBadge", "true", "section", "نمایش نوار اعتماد"),
            ("section.enabled.Service", "true", "section", "نمایش بخش خدمات"),
            ("section.enabled.WhyUsFeature", "true", "section", "نمایش چرا این مطب"),
            ("section.enabled.NavLink", "true", "section", "نمایش منوی سایت"),
            ("section.enabled.AboutBlock", "true", "section", "نمایش بلوک درباره"),
            ("section.enabled.CustomSection", "true", "section", "نمایش بخش سفارشی"),
            ("section.enabled.about", "true", "section", "نمایش بخش درباره پزشک"),
            ("section.enabled.reviews", "true", "section", "نمایش بخش نظرات"),
            ("section.enabled.contact", "true", "section", "نمایش بخش تماس"),
            ("auth.tokenHours", "24", "auth", "مدت اعتبار لاگین سایت (ساعت)"),
        };

        foreach (var item in defaults)
        {
            if (await context.PortalSiteSettings.AnyAsync(x => x.SettingKey == item.Key))
                continue;

            context.PortalSiteSettings.Add(new PortalSiteSetting
            {
                SettingKey = item.Key,
                SettingValue = item.Value,
                SettingGroup = item.Group,
                Description = item.Description,
            });
        }
    }

    private static async Task SeedContentAsync(ApplicationDbContext context)
    {
        if (await context.PortalContentItems.AnyAsync())
            return;

        var items = new List<PortalContentItem>
        {
            new() { SectionType = PortalSectionType.TrustBadge, Title = "بورد تخصصی", Subtitle = "شهید رجایی تهران", IconName = "IconGraduation", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.TrustBadge, Title = "دانشگاه تهران", Subtitle = "دکترای عمومی", IconName = "IconHospital", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.TrustBadge, Title = "استاندارد بالا", Subtitle = "تجهیزات تشخیصی", IconName = "IconShield", SortOrder = 3, IsPublished = true },
            new() { SectionType = PortalSectionType.TrustBadge, Title = "قلب و عروق", Subtitle = "تخصص اصلی", IconName = "IconHeart", SortOrder = 4, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "معاینه تخصصی قلب", Body = "ارزیابی جامع علائم و وضعیت قلب و عروق", IconName = "IconStethoscope", Color = "#ef394e", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "اکوکاردیوگرافی", Body = "بررسی دقیق عملکرد دریچه‌ها و عضله قلب", IconName = "IconEcg", Color = "#19bfd3", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "نوار قلب و فشارخون", Body = "پایش ریتم، فشار و تشخیص زودهنگام", IconName = "IconHeart", Color = "#f59e0b", SortOrder = 3, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "پیگیری بیماران مزمن", Body = "مدیریت نارسایی قلب، آریتمی و عروق کرونر", IconName = "IconShield", Color = "#10b981", SortOrder = 4, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "مشاوره درمانی", Body = "برنامه درمانی شخصی‌سازی‌شده برای هر بیمار", IconName = "IconHospital", Color = "#6366f1", SortOrder = 5, IsPublished = true },
            new() { SectionType = PortalSectionType.Service, Title = "پیشگیری و آموزش", Body = "راهنمای سبک زندگی سالم برای سلامت قلب", IconName = "IconGraduation", Color = "#ec4899", SortOrder = 6, IsPublished = true },
            new() { SectionType = PortalSectionType.WhyUsFeature, Title = "تشخیص دقیق", Body = "استفاده از تجهیزات پیشرفته قلب و عروق", IconName = "IconEcg", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.WhyUsFeature, Title = "پیگیری مستمر", Body = "برنامه درمانی و پیگیری منظم بیماران", IconName = "IconHeart", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.WhyUsFeature, Title = "محیط آرام", Body = "فضای مطب مناسب برای بیماران قلبی", IconName = "IconShield", SortOrder = 3, IsPublished = true },
            new() { SectionType = PortalSectionType.WhyUsFeature, Title = "دسترسی آسان", Body = "رزرو نوبت تلفنی و پذیرش منظم", IconName = "IconPhone", SortOrder = 4, IsPublished = true },
            new() { SectionType = PortalSectionType.NavLink, Title = "درباره پزشک", LinkUrl = "about", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.NavLink, Title = "خدمات", LinkUrl = "services", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.NavLink, Title = "نظرات بیماران", LinkUrl = "reviews", SortOrder = 3, IsPublished = true },
            new() { SectionType = PortalSectionType.NavLink, Title = "چرا این مطب؟", LinkUrl = "why", SortOrder = 4, IsPublished = true },
            new() { SectionType = PortalSectionType.NavLink, Title = "تماس", LinkUrl = "contact", SortOrder = 5, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroSlide, Title = "قلب انسان", IconName = "heart", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroSlide, Title = "اکوکاردیوگرافی", Subtitle = "تشخیص دقیق با اکو", Body = "دستگاه اکوکاردیوگرافی در مطب", LinkUrl = "echo", IconName = "image", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroSlide, Title = "فضای مطب", Subtitle = "محیطی آرام و استاندارد", Body = "فضای داخلی مطب تخصصی قلب", LinkUrl = "clinic", IconName = "image", SortOrder = 3, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroStat, Title = "+۱۰", Subtitle = "سال تجربه بالینی", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroStat, Title = "بورد", Subtitle = "تخصصی معتبر", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroStat, Title = "شوشتر", Subtitle = "پذیرش نوبتی", SortOrder = 3, IsPublished = true },
        };

        context.PortalContentItems.AddRange(items);
    }

    private static async Task SeedHeroSlidesIfMissingAsync(ApplicationDbContext context)
    {
        if (await context.PortalContentItems.AnyAsync(x => x.SectionType == PortalSectionType.HeroSlide))
            return;

        var slides = new List<PortalContentItem>
        {
            new() { SectionType = PortalSectionType.HeroSlide, Title = "قلب انسان", IconName = "heart", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroSlide, Title = "اکوکاردیوگرافی", Subtitle = "تشخیص دقیق با اکو", Body = "دستگاه اکوکاردیوگرافی در مطب", LinkUrl = "echo", IconName = "image", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroSlide, Title = "فضای مطب", Subtitle = "محیطی آرام و استاندارد", Body = "فضای داخلی مطب تخصصی قلب", LinkUrl = "clinic", IconName = "image", SortOrder = 3, IsPublished = true },
        };

        context.PortalContentItems.AddRange(slides);
    }

    private static async Task SeedHeroStatsIfMissingAsync(ApplicationDbContext context)
    {
        if (await context.PortalContentItems.AnyAsync(x => x.SectionType == PortalSectionType.HeroStat))
            return;

        var stats = new List<PortalContentItem>
        {
            new() { SectionType = PortalSectionType.HeroStat, Title = "+۱۰", Subtitle = "سال تجربه بالینی", SortOrder = 1, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroStat, Title = "بورد", Subtitle = "تخصصی معتبر", SortOrder = 2, IsPublished = true },
            new() { SectionType = PortalSectionType.HeroStat, Title = "شوشتر", Subtitle = "پذیرش نوبتی", SortOrder = 3, IsPublished = true },
        };

        context.PortalContentItems.AddRange(stats);
    }
}

using TSEAI.Application.Temporal;
using TSEAI.Application.Chat;
using TSEAI.Shared.Application;

var referenceUtc = DateTimeOffset.Parse("2026-08-11T08:00:00Z");
var resolver = new PersianTemporalResolver(new FixedClock(referenceUtc));

void Date(string input, string jalali, string gregorian, string? endJalali = null)
{
    var r = resolver.Resolve(input);
    Must(r.Status == TemporalResolutionStatus.Resolved, $"not resolved: {input}");
    Must(r.Start?.JalaliDate == jalali, $"jalali mismatch {input}: {r.Start?.JalaliDate}");
    Must(r.Start?.GregorianIso == gregorian, $"gregorian mismatch {input}: {r.Start?.GregorianIso}");
    if (endJalali is not null) Must(r.End?.JalaliDate == endJalali, $"end mismatch {input}: {r.End?.JalaliDate}");
}

Date("امروز", "1405/05/20", "2026-08-11");
Date("فردا", "1405/05/21", "2026-08-12");
Date("پس فردا", "1405/05/22", "2026-08-13");
Date("دیروز", "1405/05/19", "2026-08-10");
Date("پریروز", "1405/05/18", "2026-08-09");
Date("4روز بعد", "1405/05/24", "2026-08-15");
Date("چهار روز بعد", "1405/05/24", "2026-08-15");
Date("سه روز قبل", "1405/05/17", "2026-08-08");
Date("20/05/1405", "1405/05/20", "2026-08-11");
Date("1405/05/20", "1405/05/20", "2026-08-11");
Date("۱۴۰۵/۰۵/۲۰", "1405/05/20", "2026-08-11");
Date("۲۰/۰۵/۱۴۰۵", "1405/05/20", "2026-08-11");
Date("1405-05-20", "1405/05/20", "2026-08-11");
Date("1405.05.20", "1405/05/20", "2026-08-11");
Date("20 مرداد 1405", "1405/05/20", "2026-08-11");
Date("بیست مرداد 1405", "1405/05/20", "2026-08-11");
Date("بیستم مرداد 1405", "1405/05/20", "2026-08-11");
Date("2026-08-11", "1405/05/20", "2026-08-11");
Date("از 10 مرداد تا 20 مرداد 1405", "1405/05/10", "2026-08-01", "1405/05/20");
Date("از امروز تا فردا", "1405/05/20", "2026-08-11", "1405/05/21");
Date("از اول ماه تا امروز", "1405/05/01", "2026-07-23", "1405/05/20");
Date("این هفته", "1405/05/17", "2026-08-08", "1405/05/20");
Date("هفته قبل", "1405/05/10", "2026-08-01", "1405/05/16");
Date("ماه جاری", "1405/05/01", "2026-07-23", "1405/05/20");
Date("ماه گذشته", "1405/04/01", "2026-06-22", "1405/04/31");
Date("7 روز اخیر", "1405/05/14", "2026-08-05", "1405/05/20");
Date("سه ماه اخیر", "1405/02/21", "2026-05-11", "1405/05/20");
Date("هفته آینده", "1405/05/24", "2026-08-15", "1405/05/30");
Date("ماه آینده", "1405/06/01", "2026-08-23", "1405/06/31");
Date("امسال", "1405/01/01", "2026-03-21", "1405/05/20");
Date("سال گذشته", "1404/01/01", "2025-03-21", "1404/12/29");

var todayResolution=resolver.Resolve("امروز");
var todayAnswer=CanonicalClockAnswer.TryAnswer("امروز چندمه؟",todayResolution,referenceUtc);
Must(todayAnswer?.Contains("1405/05/20",StringComparison.Ordinal)==true,"pure current-date answer failed");
Must(todayAnswer?.Contains("2026",StringComparison.Ordinal)==false,"current-date answer must not display Gregorian date");
Must(CanonicalClockAnswer.TryAnswer("قیمت امروز فملی چنده؟",todayResolution,referenceUtc) is null,"market question must not be intercepted by clock answer");
Must(PersianDisplayText.LocalizeDates("آخرین داده (2026/08/11) است.")=="آخرین داده (1405/05/20) است.","Gregorian slash date must be Jalali in display text");
Must(PersianDisplayText.LocalizeDates("زمان 2026-08-11T12:18:59Z است.")=="زمان 1405/05/20 ساعت 12:18:59 است.","ISO timestamp must be Jalali in display text");
Must(PersianDisplayText.LocalizeDates("تاریخ 11/08/2026 میلادی")=="تاریخ 1405/05/20","day-first Gregorian date must be Jalali in display text");
Must(PersianDisplayText.LocalizeDates("تاریخ ۱۴۰۵/۰۵/۲۰")=="تاریخ ۱۴۰۵/۰۵/۲۰","Jalali display date must remain unchanged");
Must(PersianDisplayText.FormatCompactDate(20260811)=="1405/05/20","compact Gregorian date must be Jalali");
Must(PersianDisplayText.FormatCompactDate(14050520)=="1405/05/20","compact Jalali date must remain Jalali");

var tomorrow = resolver.Resolve("فردا");
Must(tomorrow.Start?.MarketDayKind == MarketDayKind.FutureTradingDayCandidate, "tomorrow trading-day classification");
var dayAfter = resolver.Resolve("پس فردا");
Must(dayAfter.Start?.MarketDayKind == MarketDayKind.FutureWeekendClosed, "Thursday weekend classification");
var noDate = resolver.Resolve("وضعیت نماد فولاد چطور است؟");
Must(noDate.Status == TemporalResolutionStatus.NotFound, "no-date should remain NotFound");
var invalid = resolver.Resolve("1405/12/30");
Must(invalid.Status == TemporalResolutionStatus.Invalid, "invalid Jalali date should fail closed");
var reverseRange = resolver.Resolve("از فردا تا امروز");
Must(reverseRange.Status == TemporalResolutionStatus.Invalid, "reverse temporal range should fail closed");

Console.WriteLine("TSEAI Sprint 14 temporal smoke tests PASSED");

static void Must(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

file sealed class FixedClock(DateTimeOffset utcNow) : IClock
{
    public DateTimeOffset UtcNow => utcNow;
}

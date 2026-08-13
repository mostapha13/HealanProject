using TSEAI.Application.Temporal;
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

using System.Globalization;
using System.Text.RegularExpressions;
using TSEAI.Shared.Application;

namespace TSEAI.Application.Temporal;

public sealed partial class PersianTemporalResolver(IClock clock) : IPersianTemporalResolver
{
    private static readonly string[] MonthNames =
    [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    private static readonly TimeZoneInfo TehranTimeZone = FindTehranTimeZone();

    public TemporalResolution Resolve(string text, DateTimeOffset? referenceUtc = null)
    {
        var original = text ?? string.Empty;
        var normalized = PersianTemporalNormalizer.Normalize(original);
        var reference = ToLocalDate(referenceUtc ?? clock.UtcNow);
        var referencePoint = Point(reference, reference);

        if (normalized.Length == 0)
            return NotFound(original, normalized, referencePoint);

        try
        {
            if (TryResolveNamedRange(normalized, reference, out var namedRange))
                return Build(original, normalized, referencePoint, namedRange);

            if (TryResolveExplicitRange(normalized, reference, out var explicitRange, out var explicitRangeRecognized))
                return Build(original, normalized, referencePoint, explicitRange);
            if (explicitRangeRecognized)
                return new(TemporalResolutionStatus.Invalid, TemporalIntentKind.DateRange, original, normalized, null,
                    "Asia/Tehran", referencePoint, null, null, null, 0, "invalid.range", "بازه زمانی نامعتبر یا معکوس است.");

            if (TryResolveRecentRange(normalized, reference, out var recentRange))
                return Build(original, normalized, referencePoint, recentRange);

            if (TryResolveRecentPeriodRange(normalized, reference, out var recentPeriodRange))
                return Build(original, normalized, referencePoint, recentPeriodRange);

            if (TryResolveRelative(normalized, reference, out var relative))
                return Build(original, normalized, referencePoint, relative);

            if (TryParseDateAtom(normalized, reference, null, out var exact))
            {
                var candidate = new Candidate(exact.Date, exact.Date, exact.MatchedText,
                    TemporalIntentKind.ExactDate, null, 1.0, exact.Rule);
                return Build(original, normalized, referencePoint, candidate);
            }

            return NotFound(original, normalized, referencePoint);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return new(TemporalResolutionStatus.Invalid, TemporalIntentKind.None, original, normalized, null,
                "Asia/Tehran", referencePoint, null, null, null, 0, "invalid.date", ex.Message);
        }
        catch (FormatException ex)
        {
            return new(TemporalResolutionStatus.Invalid, TemporalIntentKind.None, original, normalized, null,
                "Asia/Tehran", referencePoint, null, null, null, 0, "invalid.format", ex.Message);
        }
    }

    private static TemporalResolution Build(string original, string normalized, CanonicalDatePoint reference, Candidate x)
        => new(TemporalResolutionStatus.Resolved, x.Kind, original, normalized, x.MatchedText, "Asia/Tehran", reference,
            Point(x.Start, reference.GregorianDate), Point(x.End, reference.GregorianDate), x.RelativeOffset,
            x.Confidence, x.Rule, null);

    private static TemporalResolution NotFound(string original, string normalized, CanonicalDatePoint reference)
        => new(TemporalResolutionStatus.NotFound, TemporalIntentKind.None, original, normalized, null, "Asia/Tehran",
            reference, null, null, null, 0, null, null);

    private static bool TryResolveRelative(string text, DateOnly reference, out Candidate candidate)
    {
        var fixedRules = new (string Phrase, int Offset, string Rule)[]
        {
            ("پس فردا", 2, "relative.day_after_tomorrow"),
            ("پریروز", -2, "relative.day_before_yesterday"),
            ("فردا", 1, "relative.tomorrow"),
            ("دیروز", -1, "relative.yesterday"),
            ("امروز", 0, "relative.today")
        };
        foreach (var rule in fixedRules)
        {
            var index = text.IndexOf(rule.Phrase, StringComparison.Ordinal);
            if (index < 0) continue;
            var date = reference.AddDays(rule.Offset);
            candidate = new(date, date, rule.Phrase, TemporalIntentKind.RelativeDate, rule.Offset, 1.0, rule.Rule);
            return true;
        }

        var match = RelativeDaysRegex().Match(text);
        if (match.Success && PersianNumberParser.TryParse(match.Groups["n"].Value, out var n) && n <= 3660)
        {
            var direction = match.Groups["dir"].Value;
            var offset = direction is "بعد" or "آینده" ? n : -n;
            var date = reference.AddDays(offset);
            candidate = new(date, date, match.Value, TemporalIntentKind.RelativeDate, offset, 1.0, "relative.offset_days");
            return true;
        }

        if (text.Contains("اول ماه", StringComparison.Ordinal))
        {
            var (y, m, _) = ToJalali(reference);
            var date = FromJalali(y, m, 1);
            candidate = new(date, date, "اول ماه", TemporalIntentKind.RelativeDate, null, 0.99, "relative.month_start");
            return true;
        }

        if (text.Contains("آخر ماه", StringComparison.Ordinal))
        {
            var (y, m, _) = ToJalali(reference);
            var date = FromJalali(y, m, DaysInPersianMonth(y, m));
            candidate = new(date, date, "آخر ماه", TemporalIntentKind.RelativeDate, null, 0.99, "relative.month_end");
            return true;
        }

        candidate = default!;
        return false;
    }

    private static bool TryResolveRecentRange(string text, DateOnly reference, out Candidate candidate)
    {
        var match = RecentDaysRegex().Match(text);
        if (match.Success && PersianNumberParser.TryParse(match.Groups["n"].Value, out var n) && n is > 0 and <= 3660)
        {
            var start = reference.AddDays(-(n - 1));
            candidate = new(start, reference, match.Value, TemporalIntentKind.RelativeRange, null, 1.0, "range.recent_days");
            return true;
        }
        candidate = default!;
        return false;
    }

    private static bool TryResolveNamedRange(string text, DateOnly reference, out Candidate candidate)
    {
        var (jy, jm, _) = ToJalali(reference);

        if (text.Contains("از اول ماه تا امروز", StringComparison.Ordinal))
        {
            candidate = new(FromJalali(jy, jm, 1), reference, "از اول ماه تا امروز", TemporalIntentKind.RelativeRange,
                null, 1.0, "range.month_to_today");
            return true;
        }

        if (text.Contains("این هفته", StringComparison.Ordinal) || text.Contains("هفته جاری", StringComparison.Ordinal))
        {
            var start = StartOfPersianWeek(reference);
            candidate = new(start, reference, text.Contains("این هفته", StringComparison.Ordinal) ? "این هفته" : "هفته جاری",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.current_week");
            return true;
        }

        if (text.Contains("هفته قبل", StringComparison.Ordinal) || text.Contains("هفته گذشته", StringComparison.Ordinal))
        {
            var currentStart = StartOfPersianWeek(reference);
            var start = currentStart.AddDays(-7);
            candidate = new(start, start.AddDays(6), text.Contains("هفته قبل", StringComparison.Ordinal) ? "هفته قبل" : "هفته گذشته",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.previous_week");
            return true;
        }

        if (text.Contains("ماه جاری", StringComparison.Ordinal) || text.Contains("این ماه", StringComparison.Ordinal))
        {
            candidate = new(FromJalali(jy, jm, 1), reference, text.Contains("ماه جاری", StringComparison.Ordinal) ? "ماه جاری" : "این ماه",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.current_month");
            return true;
        }

        if (text.Contains("ماه گذشته", StringComparison.Ordinal) || text.Contains("ماه قبل", StringComparison.Ordinal))
        {
            var py = jy;
            var pm = jm - 1;
            if (pm == 0) { pm = 12; py--; }
            var start = FromJalali(py, pm, 1);
            var end = FromJalali(py, pm, DaysInPersianMonth(py, pm));
            candidate = new(start, end, text.Contains("ماه گذشته", StringComparison.Ordinal) ? "ماه گذشته" : "ماه قبل",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.previous_month");
            return true;
        }

        if (text.Contains("هفته آینده", StringComparison.Ordinal) || text.Contains("هفته بعد", StringComparison.Ordinal))
        {
            var start = StartOfPersianWeek(reference).AddDays(7);
            candidate = new(start, start.AddDays(6), text.Contains("هفته آینده", StringComparison.Ordinal) ? "هفته آینده" : "هفته بعد",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.next_week");
            return true;
        }

        if (text.Contains("ماه آینده", StringComparison.Ordinal) || text.Contains("ماه بعد", StringComparison.Ordinal))
        {
            var ny = jy;
            var nm = jm + 1;
            if (nm == 13) { nm = 1; ny++; }
            var start = FromJalali(ny, nm, 1);
            var end = FromJalali(ny, nm, DaysInPersianMonth(ny, nm));
            candidate = new(start, end, text.Contains("ماه آینده", StringComparison.Ordinal) ? "ماه آینده" : "ماه بعد",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.next_month");
            return true;
        }

        if (text.Contains("امسال", StringComparison.Ordinal) || text.Contains("سال جاری", StringComparison.Ordinal))
        {
            candidate = new(FromJalali(jy, 1, 1), reference, text.Contains("امسال", StringComparison.Ordinal) ? "امسال" : "سال جاری",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.current_year");
            return true;
        }

        if (text.Contains("سال گذشته", StringComparison.Ordinal) || text.Contains("سال قبل", StringComparison.Ordinal))
        {
            var py = jy - 1;
            candidate = new(FromJalali(py, 1, 1), FromJalali(py, 12, DaysInPersianMonth(py, 12)),
                text.Contains("سال گذشته", StringComparison.Ordinal) ? "سال گذشته" : "سال قبل",
                TemporalIntentKind.RelativeRange, null, 1.0, "range.previous_year");
            return true;
        }

        candidate = default!;
        return false;
    }

    private static bool TryResolveExplicitRange(string text, DateOnly reference, out Candidate candidate, out bool recognized)
    {
        recognized = false;
        var match = ExplicitRangeRegex().Match(text);
        if (!match.Success)
        {
            candidate = default!;
            return false;
        }

        var leftText = match.Groups["left"].Value.Trim();
        var rightText = match.Groups["right"].Value.Trim();

        if (!TryParseRangeAtom(rightText, reference, null, out var right))
        {
            candidate = default!;
            return false;
        }

        int? inheritedYear = right.IsPersian && right.HasExplicitYear ? right.PersianYear : null;
        if (!TryParseRangeAtom(leftText, reference, inheritedYear, out var left))
        {
            candidate = default!;
            return false;
        }

        recognized = true;
        var start = left.Date;
        var end = right.Date;
        if (end < start && right.IsPersian && !right.HasExplicitYear)
        {
            var (ey, em, ed) = ToJalali(end);
            end = FromJalali(ey + 1, em, ed);
        }

        if (end < start)
        {
            candidate = default!;
            return false;
        }

        candidate = new(start, end, match.Value, TemporalIntentKind.DateRange, null, 1.0, "range.explicit");
        return true;
    }

    private static bool TryResolveRecentPeriodRange(string text, DateOnly reference, out Candidate candidate)
    {
        var match = RecentPeriodsRegex().Match(text);
        if (match.Success && PersianNumberParser.TryParse(match.Groups["n"].Value, out var n) && n is > 0 and <= 120)
        {
            var unit = match.Groups["unit"].Value;
            var start = unit == "هفته"
                ? reference.AddDays(-(n * 7 - 1))
                : AddPersianMonths(reference, -n).AddDays(1);
            candidate = new(start, reference, match.Value, TemporalIntentKind.RelativeRange, null, 0.99,
                unit == "هفته" ? "range.recent_weeks" : "range.recent_months");
            return true;
        }
        candidate = default!;
        return false;
    }

    private static bool TryParseRangeAtom(string text, DateOnly reference, int? inheritedPersianYear, out ParsedDate parsed)
    {
        var normalized = PersianTemporalNormalizer.Normalize(text);
        foreach (var rule in new (string Phrase, int Offset, string Rule)[]
        {
            ("پس فردا", 2, "relative.day_after_tomorrow"),
            ("پریروز", -2, "relative.day_before_yesterday"),
            ("فردا", 1, "relative.tomorrow"),
            ("دیروز", -1, "relative.yesterday"),
            ("امروز", 0, "relative.today")
        })
        {
            if (!normalized.Contains(rule.Phrase, StringComparison.Ordinal)) continue;
            parsed = new(reference.AddDays(rule.Offset), rule.Phrase, false, false, null, rule.Rule);
            return true;
        }

        var relative = RelativeDaysRegex().Match(normalized);
        if (relative.Success && PersianNumberParser.TryParse(relative.Groups["n"].Value, out var n) && n <= 3660)
        {
            var direction = relative.Groups["dir"].Value;
            var offset = direction is "بعد" or "آینده" ? n : -n;
            var date = reference.AddDays(offset);
            parsed = new(date, relative.Value, false, false, null, "relative.offset_days");
            return true;
        }

        return TryParseDateAtom(normalized, reference, inheritedPersianYear, out parsed);
    }

    private static bool TryParseDateAtom(string text, DateOnly reference, int? inheritedPersianYear, out ParsedDate parsed)
    {
        var numeric = NumericDateRegex().Match(text);
        if (numeric.Success)
        {
            var a = int.Parse(numeric.Groups["a"].Value, CultureInfo.InvariantCulture);
            var b = int.Parse(numeric.Groups["b"].Value, CultureInfo.InvariantCulture);
            var c = int.Parse(numeric.Groups["c"].Value, CultureInfo.InvariantCulture);
            DateOnly date;
            var isPersian = false;
            var explicitYear = true;
            int? persianYear = null;

            if (numeric.Groups["a"].Value.Length == 4 && a is >= 1200 and <= 1600)
            {
                date = FromJalali(a, b, c); isPersian = true; persianYear = a;
            }
            else if (numeric.Groups["c"].Value.Length == 4 && c is >= 1200 and <= 1600)
            {
                date = FromJalali(c, b, a); isPersian = true; persianYear = c;
            }
            else if (numeric.Groups["a"].Value.Length == 4 && a is >= 1900 and <= 2200)
            {
                date = new DateOnly(a, b, c);
            }
            else if (numeric.Groups["c"].Value.Length == 4 && c is >= 1900 and <= 2200)
            {
                date = new DateOnly(c, b, a);
            }
            else
            {
                parsed = default!;
                return false;
            }

            parsed = new(date, numeric.Value, isPersian, explicitYear, persianYear, "exact.numeric");
            return true;
        }

        var month = PersianMonthRegex().Match(text);
        if (month.Success && PersianNumberParser.TryParse(month.Groups["day"].Value, out var day) && day is >= 1 and <= 31)
        {
            var monthIndex = Array.IndexOf(MonthNames, month.Groups["month"].Value) + 1;
            var yearText = month.Groups["year"].Value;
            var hasYear = yearText.Length == 4;
            var year = hasYear ? int.Parse(yearText, CultureInfo.InvariantCulture)
                : inheritedPersianYear ?? ToJalali(reference).Year;
            if (year is < 1200 or > 1600)
            {
                parsed = default!;
                return false;
            }
            var date = FromJalali(year, monthIndex, day);
            parsed = new(date, month.Value, true, hasYear, year, "exact.persian_month_name");
            return true;
        }

        parsed = default!;
        return false;
    }

    private static DateOnly AddPersianMonths(DateOnly date, int months)
    {
        var (year, month, day) = ToJalali(date);
        var zeroBased = (year * 12 + (month - 1)) + months;
        var targetYear = Math.DivRem(zeroBased, 12, out var targetMonthZero);
        if (targetMonthZero < 0) { targetMonthZero += 12; targetYear--; }
        var targetMonth = targetMonthZero + 1;
        var targetDay = Math.Min(day, DaysInPersianMonth(targetYear, targetMonth));
        return FromJalali(targetYear, targetMonth, targetDay);
    }

    private static DateOnly StartOfPersianWeek(DateOnly date)
    {
        // Persian market week starts on Saturday. Saturday=0 ... Friday=6.
        var offset = date.DayOfWeek switch
        {
            DayOfWeek.Saturday => 0,
            DayOfWeek.Sunday => 1,
            DayOfWeek.Monday => 2,
            DayOfWeek.Tuesday => 3,
            DayOfWeek.Wednesday => 4,
            DayOfWeek.Thursday => 5,
            DayOfWeek.Friday => 6,
            _ => 0
        };
        return date.AddDays(-offset);
    }

    private static int DaysInPersianMonth(int year, int month)
        => new PersianCalendar().GetDaysInMonth(year, month);

    private static DateOnly FromJalali(int year, int month, int day)
    {
        if (month is < 1 or > 12) throw new ArgumentOutOfRangeException(nameof(month), "ماه شمسی نامعتبر است.");
        var max = DaysInPersianMonth(year, month);
        if (day is < 1 || day > max) throw new ArgumentOutOfRangeException(nameof(day), "روز شمسی نامعتبر است.");
        var calendar = new PersianCalendar();
        return DateOnly.FromDateTime(calendar.ToDateTime(year, month, day, 0, 0, 0, 0));
    }

    private static (int Year, int Month, int Day) ToJalali(DateOnly date)
    {
        var dt = date.ToDateTime(TimeOnly.MinValue);
        var calendar = new PersianCalendar();
        return (calendar.GetYear(dt), calendar.GetMonth(dt), calendar.GetDayOfMonth(dt));
    }

    private static CanonicalDatePoint Point(DateOnly date, DateOnly reference)
    {
        var (y, m, d) = ToJalali(date);
        var future = date > reference;
        var weekend = date.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday;
        var marketDay = (future, weekend) switch
        {
            (false, false) => MarketDayKind.TradingDayCandidate,
            (false, true) => MarketDayKind.WeekendClosed,
            (true, false) => MarketDayKind.FutureTradingDayCandidate,
            (true, true) => MarketDayKind.FutureWeekendClosed
        };
        return new(date, date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), $"{y:0000}/{m:00}/{d:00}",
            date.DayOfWeek, future, marketDay, HolidayCalendarEvaluated: false);
    }

    private static DateOnly ToLocalDate(DateTimeOffset utc)
        => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(utc, TehranTimeZone).DateTime);

    private static TimeZoneInfo FindTehranTimeZone()
    {
        foreach (var id in new[] { "Asia/Tehran", "Iran Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.CreateCustomTimeZone("TSEAI-Tehran-Fallback", TimeSpan.FromHours(3.5), "Tehran", "Tehran");
    }

    private sealed record Candidate(DateOnly Start, DateOnly End, string MatchedText, TemporalIntentKind Kind,
        int? RelativeOffset, double Confidence, string Rule);

    private sealed record ParsedDate(DateOnly Date, string MatchedText, bool IsPersian, bool HasExplicitYear,
        int? PersianYear, string Rule);

    [GeneratedRegex(@"(?<!\d)(?<a>\d{1,4})\s*[\/\.\-]\s*(?<b>\d{1,2})\s*[\/\.\-]\s*(?<c>\d{1,4})(?!\d)")]
    private static partial Regex NumericDateRegex();

    [GeneratedRegex(@"(?<day>\d{1,2}|[آ-ی]+(?:\s+و\s+[آ-ی]+)?)\s+(?<month>فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)(?:\s+(?<year>\d{4}))?")]
    private static partial Regex PersianMonthRegex();

    [GeneratedRegex(@"(?<n>\d+|[آ-ی]+(?:\s+و\s+[آ-ی]+)?)\s*روز\s*(?<dir>بعد|آینده|قبل|پیش)")]
    private static partial Regex RelativeDaysRegex();

    [GeneratedRegex(@"(?<n>\d+|[آ-ی]+(?:\s+و\s+[آ-ی]+)?)\s*روز\s*(?:اخیر|گذشته)")]
    private static partial Regex RecentDaysRegex();

    [GeneratedRegex(@"(?<n>\d+|[آ-ی]+(?:\s+و\s+[آ-ی]+)?)\s*(?<unit>هفته|ماه)\s*(?:اخیر|گذشته)")]
    private static partial Regex RecentPeriodsRegex();

    [GeneratedRegex(@"از\s+(?<left>.+?)\s+تا\s+(?<right>.+?)(?=$|[،,؛;؟?])")]
    private static partial Regex ExplicitRangeRegex();
}

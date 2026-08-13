namespace TSEAI.Application.Temporal;

public enum TemporalResolutionStatus
{
    NotFound = 0,
    Resolved = 1,
    Ambiguous = 2,
    Invalid = 3
}

public enum TemporalIntentKind
{
    None = 0,
    ExactDate = 1,
    RelativeDate = 2,
    DateRange = 3,
    RelativeRange = 4
}

public enum MarketDayKind
{
    TradingDayCandidate = 1,
    WeekendClosed = 2,
    FutureTradingDayCandidate = 3,
    FutureWeekendClosed = 4
}

public sealed record CanonicalDatePoint(
    DateOnly GregorianDate,
    string GregorianIso,
    string JalaliDate,
    DayOfWeek DayOfWeek,
    bool IsFuture,
    MarketDayKind MarketDayKind,
    bool HolidayCalendarEvaluated);

public sealed record TemporalResolution(
    TemporalResolutionStatus Status,
    TemporalIntentKind Kind,
    string OriginalText,
    string NormalizedText,
    string? MatchedText,
    string TimeZoneId,
    CanonicalDatePoint ReferenceDate,
    CanonicalDatePoint? Start,
    CanonicalDatePoint? End,
    int? RelativeDayOffset,
    double Confidence,
    string? Rule,
    string? Error)
{
    public bool HasTemporalReference => Status == TemporalResolutionStatus.Resolved && Start is not null;
    public bool IsRange => Start is not null && End is not null && Start.GregorianDate != End.GregorianDate;
    public bool IsFuture => (Start?.IsFuture ?? false) || (End?.IsFuture ?? false);
    public bool IsReferenceDayOnly => Start is not null
        && End is not null
        && Start.GregorianDate == ReferenceDate.GregorianDate
        && End.GregorianDate == ReferenceDate.GregorianDate;
}

public interface IPersianTemporalResolver
{
    TemporalResolution Resolve(string text, DateTimeOffset? referenceUtc = null);
}

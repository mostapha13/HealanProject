using NegareshAI.Api.Application.Common.Dates;
using Xunit;

namespace NegareshAI.Api.Tests;

public sealed class PersianDateTests
{
    [Fact]
    public void Format_UsesPersianCalendarAndPersianDigits()
    {
        var result = PersianDate.Format(new DateOnly(2024, 3, 20));

        Assert.Equal("۱۴۰۳/۰۱/۰۱", result);
    }

    [Fact]
    public void ParseDateOnly_AcceptsPersianAndArabicDigits()
    {
        Assert.Equal(new DateOnly(2024, 3, 20), PersianDate.ParseDateOnly("۱۴۰۳/۰۱/۰۱"));
        Assert.Equal(new DateOnly(2024, 3, 20), PersianDate.ParseDateOnly("١٤٠٣/٠١/٠١"));
    }

    [Fact]
    public void ParseDateOnly_RejectsInvalidPersianDate()
    {
        Assert.Throws<FormatException>(() => PersianDate.ParseDateOnly("۱۴۰۲/۱۲/۳۰"));
    }

    [Fact]
    public void FormatDateTime_ConvertsUtcToIranBeforeFormatting()
    {
        var utc = new DateTime(2024, 3, 19, 21, 0, 0, DateTimeKind.Utc);

        Assert.Equal("۱۴۰۳/۰۱/۰۱، ساعت ۰۰:۳۰", PersianDate.FormatDateTime(utc));
    }
}

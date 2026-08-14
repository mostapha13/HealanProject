namespace TSEAI.Application.Entities;

/// <summary>
/// Encodes instrument-class vocabulary, independently of any company or ticker.
/// Generic company mentions prefer the primary cash instrument; explicit derivative
/// or rights questions keep every matching instrument class eligible.
/// </summary>
public static class InstrumentQuerySemantics
{
    private static readonly HashSet<string> ClassMarkers = new(StringComparer.Ordinal)
    {
        "اختیار", "آپشن", "option", "آتی", "فیوچرز", "future", "سلف",
        "حق‌تقدم", "حق", "تقدم"
    };

    public static bool PrefersPrimaryInstrument(IEnumerable<string> normalizedForms) =>
        !normalizedForms.Any(value => value.Split(' ', StringSplitOptions.RemoveEmptyEntries).Any(ClassMarkers.Contains));
}

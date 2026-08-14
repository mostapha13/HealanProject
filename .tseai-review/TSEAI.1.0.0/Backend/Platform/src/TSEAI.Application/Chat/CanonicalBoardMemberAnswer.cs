namespace TSEAI.Application.Chat;

public readonly record struct CanonicalBoardQuestionIntent(
    bool IsMemberList,
    bool NamesOnly,
    bool WantsHistory = false,
    bool WantsRepresentation = false)
{
    public bool NeedsKnowledge => WantsHistory || WantsRepresentation;
}

public sealed record CanonicalBoardMember
{
    public long ContentId { get; set; }
    public string FullName { get; set; } = "";
    public string Role { get; set; } = "";
    public int Position { get; set; }
    public DateTime? EffectiveAt { get; set; }
}

/// <summary>
/// Detects board-list questions independently of their colloquial Persian wording and
/// formats the structured answer according to the requested level of detail.
/// </summary>
public static class CanonicalBoardMemberAnswer
{
    private static readonly string[] ListCues =
    [
        "اعضا", "اعضای", "افراد", "اشخاص", "نفرات", "اسامی", "فهرست", "لیست", "کلیه", "تمام", "همه", "ترکیب"
    ];

    private static readonly string[] PluralPersonCues =
    [
        "کیا", "کیان", "چه کسانی", "چه افرادی", "چه اشخاصی", "چه نفراتی"
    ];

    private static readonly string[] SingularPositionCues =
    [
        "رئیس", "رییس", "نایب رئیس", "نائب رئیس", "نایب رییس", "نائب رییس", "مدیرعامل", "مدیر عامل"
    ];

    private static readonly string[] NameCues =
    [
        "فقط اسم", "فقط نام", "اسم اعضا", "اسم اعضای", "نام اعضا", "نام اعضای", "اسامی", "اسم ها", "نام ها", "اسم ببر", "نام ببر"
    ];

    private static readonly string[] HistoryCues =
    [
        "سابقه", "سوابق", "رزومه", "پیشینه", "قبلا", "قبلی", "پیشین"
    ];

    private static readonly string[] RepresentationCues =
    [
        "نماینده", "نمایندگی", "از طرف", "از سوی", "کدام شرکت", "کدوم شرکت", "چه شرکتی", "وابسته به"
    ];

    public static CanonicalBoardQuestionIntent Parse(string? question)
    {
        var normalized = Normalize(question);
        var hasBoard = normalized.Contains("هیئت مدیره", StringComparison.Ordinal)
            || normalized.Contains("هیات مدیره", StringComparison.Ordinal)
            || normalized.Contains("هیأت مدیره", StringComparison.Ordinal);
        if (!hasBoard || normalized.Contains("کمیته", StringComparison.Ordinal))
            return default;

        var hasExplicitListCue = ListCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        var hasPluralPersonCue = PluralPersonCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        var asksSingularPosition = SingularPositionCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        var isMemberList = hasExplicitListCue || (hasPluralPersonCue && !asksSingularPosition);
        if (!isMemberList)
            return default;

        var namesOnly = NameCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        var wantsHistory = HistoryCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        var wantsRepresentation = RepresentationCues.Any(cue => ContainsWordOrPhrase(normalized, cue));
        return new CanonicalBoardQuestionIntent(true, namesOnly, wantsHistory, wantsRepresentation);
    }

    public static (bool WantsHistory, bool WantsRepresentation) AdditionalPersonFacets(string? question)
    {
        var normalized=Normalize(question);
        return (
            HistoryCues.Any(cue=>ContainsWordOrPhrase(normalized,cue)),
            RepresentationCues.Any(cue=>ContainsWordOrPhrase(normalized,cue)));
    }

    public static string? Compose(CanonicalBoardQuestionIntent intent, IEnumerable<CanonicalBoardMember> members)
    {
        if (!intent.IsMemberList)
            return null;

        var current = members
            .Where(member => !string.IsNullOrWhiteSpace(member.FullName))
            .Select(member => member with
            {
                FullName = PersianDisplayText.Normalize(member.FullName),
                Role = PersianDisplayText.Normalize(member.Role)
            })
            .Where(member => member.FullName.Length > 0 && member.FullName != member.Role)
            .GroupBy(member => member.FullName, StringComparer.Ordinal)
            .Select(group => group.OrderBy(member => member.Position).First())
            .OrderBy(member => member.Position)
            .ThenBy(member => member.FullName, StringComparer.Ordinal)
            .ToArray();

        if (current.Length == 0)
            return null;

        if (intent.NamesOnly)
            return string.Join("، ", current.Select(member => member.FullName));

        var lines = current.Select((member, index) =>
        {
            var role = string.IsNullOrWhiteSpace(member.Role) ? "عضو هیئت‌مدیره" : member.Role;
            return $"{index + 1}. {member.FullName} — {role}";
        });
        return "اعضای فعلی ثبت‌شده هیئت‌مدیره بورس تهران:\n\n" + string.Join("\n", lines);
    }

    private static bool ContainsWordOrPhrase(string value, string cue)
    {
        var index = value.IndexOf(cue, StringComparison.Ordinal);
        while (index >= 0)
        {
            var beforeIsBoundary = index == 0 || value[index - 1] == ' ';
            var after = index + cue.Length;
            var afterIsBoundary = after == value.Length || value[after] == ' ';
            if (beforeIsBoundary && afterIsBoundary)
                return true;
            index = value.IndexOf(cue, index + 1, StringComparison.Ordinal);
        }
        return false;
    }

    private static string Normalize(string? value)
    {
        var normalized = (value ?? "")
            .Trim()
            .ToLowerInvariant()
            .Replace('ي', 'ی')
            .Replace('ى', 'ی')
            .Replace('ك', 'ک')
            .Replace('\u200c', ' ');
        foreach (var punctuation in new[] { '؟', '?', '.', '!', '،', ',', '؛', ';', ':', '"', '\'', '«', '»', '(', ')' })
            normalized = normalized.Replace(punctuation, ' ');
        return string.Join(' ', normalized.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
    }
}

using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public static class CanonicalOrganizationEvidencePolicy
{
    private static readonly IReadOnlySet<string> DeterministicFacets = new HashSet<string>(StringComparer.Ordinal)
    {
        "member_history",
        "person_history",
        "representing_company"
    };

    private static readonly string[] ProfessionalHistoryCues =
    [
        "سابقه", "سوابق", "رزومه", "پیشینه", "تحصیل", "دانش‌آموخته", "دانش آموخته",
        "فارغ‌التحصیل", "فارغ التحصیل", "پیش از این", "پیش‌تر", "قبلاً", "پیشین",
        "سال تجربه", "تجربه مدیریتی", "سمت‌های پیشین", "سمت های پیشین"
    ];

    public static bool IsProfessionalHistoryExcerpt(string? excerpt,IReadOnlyList<string> subjects)
    {
        var text=Compact(excerpt);
        if(text.Length==0) return false;
        var cues=ProfessionalHistoryCues.Select(Compact).Where(x=>x.Length>0).Distinct(StringComparer.Ordinal).ToArray();
        foreach(var subject in subjects.Select(Compact).Where(x=>x.Length>1).Distinct(StringComparer.Ordinal))
        {
            var subjectIndex=text.IndexOf(subject,StringComparison.Ordinal);
            if(subjectIndex<0) continue;
            foreach(var cue in cues)
            {
                var cueIndex=text.IndexOf(cue,StringComparison.Ordinal);
                while(cueIndex>=0)
                {
                    if(Math.Abs(cueIndex-subjectIndex)<=160) return true;
                    cueIndex=text.IndexOf(cue,cueIndex+1,StringComparison.Ordinal);
                }
            }
        }
        return false;
    }

    public static bool ShouldUseDeterministicKnowledgeRoute(CanonicalReferenceAnswer? answer)
        => answer is { IsComplete: false }
            && answer.Reference.Kind is "organization_person" or "organization_board" or "organization_unit"
            && answer.MissingFacets.Count>0
            && answer.KnowledgeQueries.Count>0
            && answer.MissingFacets.All(DeterministicFacets.Contains);

    private static string Compact(string? value)
        => Regex.Replace(PersianDisplayText.Normalize(value??string.Empty),@"[^\p{L}\p{Nd}]",string.Empty);
}

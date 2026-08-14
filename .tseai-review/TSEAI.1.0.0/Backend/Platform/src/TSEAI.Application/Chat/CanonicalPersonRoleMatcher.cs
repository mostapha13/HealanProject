using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public sealed class CanonicalPersonRoleCandidate
{
    public long ContentId { get; set; }
    public int? TsePersonCateryId { get; set; }
    public bool IsMaster { get; set; }
    public string Role { get; set; } = "";
    public string FullName { get; set; } = "";
    public DateTime? SourceCollectedAt { get; set; }
}

public static partial class CanonicalPersonRoleMatcher
{
    private static readonly HashSet<string> QuestionWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "چه", "کسی", "کیست", "کیه", "نام", "شخص", "فرد", "است", "هست", "فعلی",
        "بورس", "تهران", "را", "رو", "بگو", "معرفی", "کن"
    };

    private static readonly HashSet<string> GenericRoleWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "مدیر", "معاون", "رئیس", "رییس", "سرپرست", "مسئول"
    };

    private static readonly HashSet<string> PersonTitles = new(StringComparer.OrdinalIgnoreCase)
    {
        "آقای", "خانم", "دکتر", "مهندس", "جناب", "سید"
    };

    public static bool IsPersonRoleQuestion(string question)
    {
        var normalized = Normalize(question);
        var normalizedForParticles = normalized.Replace("؟", " ").Replace("?", " ");
        var asksPerson = normalizedForParticles.Contains("چه کسی", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چه فردی", StringComparison.Ordinal)
            || normalizedForParticles.Contains("کدام فرد", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چه شخصی", StringComparison.Ordinal)
            || normalizedForParticles.Contains("کدام شخص", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چیست", StringComparison.Ordinal)
            || normalizedForParticles.Contains("کیه", StringComparison.Ordinal)
            || normalizedForParticles.Contains("کیست", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چه کدوم", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چیا", StringComparison.Ordinal)
            || normalizedForParticles.Contains("چیه", StringComparison.Ordinal)
            || normalizedForParticles.Contains("اسم", StringComparison.Ordinal);
        var tokens = Tokens(normalized);
        var hasRole = GenericRoleWords.Any(tokens.Contains)
            || normalized.Contains("مدیرعامل", StringComparison.Ordinal)
            || normalized.Contains("مدیر عامل", StringComparison.Ordinal);
        var asksInstitution = normalized.Contains("چه نهادی",StringComparison.Ordinal)
            || normalized.Contains("چه واحدی",StringComparison.Ordinal)
            || normalized.Contains("چه گروهی",StringComparison.Ordinal)
            || normalized.Contains("کدام نهاد",StringComparison.Ordinal)
            || normalized.Contains("کدام واحد",StringComparison.Ordinal)
            || normalized.Contains("کدام گروه",StringComparison.Ordinal);
        return asksPerson && hasRole && !asksInstitution;
    }

    public static CanonicalPersonRoleCandidate? Match(string question, IReadOnlyList<CanonicalPersonRoleCandidate> candidates)
    {
        var queryTokens = Tokens(Normalize(question))
            .Where(x => !QuestionWords.Contains(x) && x != "و")
            .Select(Alias)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (queryTokens.Count == 0) return null;

        var ranked = candidates
            .Where(x => !string.IsNullOrWhiteSpace(x.Role) && !string.IsNullOrWhiteSpace(x.FullName))
            .Select(candidate =>
            {
                var roleTokens = Tokens(Normalize(candidate.Role)).Where(x => x != "و").Select(Alias).ToHashSet(StringComparer.OrdinalIgnoreCase);
                var overlap = queryTokens.Intersect(roleTokens, StringComparer.OrdinalIgnoreCase).ToArray();
                var specific = overlap.Count(x => !GenericRoleWords.Contains(x));
                var coverage = queryTokens.Count == 0 ? 0d : (double)overlap.Length / queryTokens.Count;
                var extra = roleTokens.Count - overlap.Length;
                return new { Candidate = candidate, Overlap = overlap.Length, Specific = specific, Coverage = coverage, Extra = extra };
            })
            .Where(x => x.Overlap > 0 && x.Specific > 0)
            .OrderByDescending(x => x.Specific)
            .ThenByDescending(x => x.Overlap)
            .ThenByDescending(x => x.Coverage)
            .ThenBy(x => x.Extra)
            .ThenByDescending(x => x.Candidate.ContentId)
            .ToArray();

        if (ranked.Length == 0) return null;
        if (ranked.Length > 1 && ranked[0].Specific == ranked[1].Specific && ranked[0].Overlap == ranked[1].Overlap && ranked[0].Coverage == ranked[1].Coverage && ranked[0].Extra == ranked[1].Extra)
            return null;
        return ranked[0].Candidate;
    }

    public static CanonicalPersonRoleCandidate? MatchPersonName(string question,IReadOnlyList<CanonicalPersonRoleCandidate> candidates)
    {
        var queryTokens=Tokens(Normalize(question));
        if(queryTokens.Count==0) return null;

        var ranked=candidates
            .Where(x=>!string.IsNullOrWhiteSpace(x.FullName))
            .Select(candidate=>
            {
                var nameTokens=Tokens(Normalize(candidate.FullName)).Where(x=>!PersonTitles.Contains(x)).ToArray();
                var overlap=nameTokens.Count(queryTokens.Contains);
                var full=nameTokens.Length>0 && overlap==nameTokens.Length;
                return new { Candidate=candidate,NameTokens=nameTokens.Length,Overlap=overlap,Full=full };
            })
            .Where(x=>x.Full || x.Overlap>=2 || (x.NameTokens==1 && x.Overlap==1))
            .OrderByDescending(x=>x.Full)
            .ThenByDescending(x=>x.Overlap)
            .ThenByDescending(x=>x.NameTokens)
            .ThenByDescending(x=>x.Candidate.ContentId)
            .ToArray();

        if(ranked.Length==0) return null;
        if(ranked.Length>1 && ranked[0].Full==ranked[1].Full && ranked[0].Overlap==ranked[1].Overlap && ranked[0].NameTokens==ranked[1].NameTokens)
            return null;
        return ranked[0].Candidate;
    }

    private static string Alias(string token) => token.ToLowerInvariant() switch
    {
        "it" or "آیتی" => "فناوری",
        "رییس" => "رئیس",
        _ => token.ToLowerInvariant()
    };

    private static HashSet<string> Tokens(string value) => TokenRegex().Matches(value).Select(x => x.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);

    private static string Normalize(string value) => (value ?? "").Trim()
        .Replace('ي', 'ی').Replace('ى', 'ی').Replace('ك', 'ک')
        .Replace("آی تی", "آیتی", StringComparison.OrdinalIgnoreCase)
        .Replace("مدیر عامل", "مدیرعامل", StringComparison.Ordinal)
        .Replace('\u200c', ' ');

    [GeneratedRegex(@"[\u0600-\u06FFA-Za-z]+", RegexOptions.CultureInvariant)]
    private static partial Regex TokenRegex();
}

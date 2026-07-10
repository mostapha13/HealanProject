using System.Globalization;
using System.Text.RegularExpressions;

namespace Healan.Application.Portal;

public static partial class BlogSlugHelper
{
    public static string CreateSlug(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var slug = input.Trim().ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("_", "-");

        slug = SlugInvalidCharsRegex().Replace(slug, string.Empty);
        slug = SlugDuplicateDashRegex().Replace(slug, "-").Trim('-');

        return slug.Length > 180 ? slug[..180].Trim('-') : slug;
    }

    public static async Task<string> EnsureUniqueSlugAsync(
        Func<string, Task<bool>> slugExists,
        string? preferredSlug,
        string title,
        long? excludeBlogPostId = null)
    {
        var baseSlug = CreateSlug(preferredSlug);
        if (string.IsNullOrWhiteSpace(baseSlug))
            baseSlug = CreateSlug(title);
        if (string.IsNullOrWhiteSpace(baseSlug))
            baseSlug = $"post-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var candidate = baseSlug;
        var suffix = 2;
        while (await slugExists(candidate))
        {
            candidate = $"{baseSlug}-{suffix.ToString(CultureInfo.InvariantCulture)}";
            suffix++;
        }

        return candidate;
    }

    [GeneratedRegex(@"[^\p{L}\p{Nd}\-]+", RegexOptions.Compiled)]
    private static partial Regex SlugInvalidCharsRegex();

    [GeneratedRegex(@"-{2,}", RegexOptions.Compiled)]
    private static partial Regex SlugDuplicateDashRegex();
}

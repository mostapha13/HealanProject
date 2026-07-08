using FileManager.GrpcClient.Interfaces;
using Healan.Application.Portal.Dtos;

namespace Healan.Application.Portal;

public static class PortalContentImageResolver
{
    public static async Task ApplyFileLinksAsync(IReadOnlyList<PortalContentItemDto> items, IFileManagerTool fileManager, CancellationToken cancellationToken = default)
    {
        var fileIds = items
            .Where(x => x.ImageFileId.HasValue)
            .Select(x => x.ImageFileId!.Value)
            .Distinct()
            .ToList();

        if (fileIds.Count == 0)
            return;

        var infos = await fileManager.GetFileReplyInfos(fileIds);
        var linkById = infos
            .Where(x => !string.IsNullOrWhiteSpace(x.FileId))
            .ToDictionary(x => Guid.Parse(x.FileId), x => x.Link, comparer: EqualityComparer<Guid>.Default);

        foreach (var item in items)
        {
            if (item.ImageFileId is not Guid fileId)
                continue;

            if (linkById.TryGetValue(fileId, out var link) && !string.IsNullOrWhiteSpace(link))
                item.ImageUrl = link;
        }
    }
}

public static class PortalSectionVisibility
{
    private const string Prefix = "section.enabled.";

    public static bool IsEnabled(IReadOnlyDictionary<string, string> settings, string sectionKey, bool defaultEnabled = true)
    {
        if (!settings.TryGetValue($"{Prefix}{sectionKey}", out var value))
            return defaultEnabled;

        return !string.Equals(value, "false", StringComparison.OrdinalIgnoreCase)
            && value != "0";
    }

    public static bool IsContentSectionEnabled(IReadOnlyDictionary<string, string> settings, string sectionTypeName) =>
        IsEnabled(settings, sectionTypeName, defaultEnabled: true);

    public static HashSet<string> DisabledContentSectionTypes(IReadOnlyDictionary<string, string> settings)
    {
        return settings
            .Where(x => x.Key.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            .Where(x => !IsEnabledValue(x.Value))
            .Select(x => x.Key[Prefix.Length..])
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsEnabledValue(string? value) =>
        !string.Equals(value, "false", StringComparison.OrdinalIgnoreCase) && value != "0";
}

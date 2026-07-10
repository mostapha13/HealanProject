using Healan.Application.Portal.Dtos;
using FileManager.GrpcClient.Interfaces;

namespace Healan.Application.Portal;

public static class BlogPostImageResolver
{
    public static async Task ApplyCoverLinkAsync(
        BlogPostSummaryDto item,
        IFileManagerTool fileManagerTool,
        CancellationToken cancellationToken)
    {
        if (!item.CoverImageFileId.HasValue)
            return;

        var fileInfo = await fileManagerTool.GetFileReplyInfo(item.CoverImageFileId.Value);
        if (!string.IsNullOrWhiteSpace(fileInfo.Link))
            item.CoverImageUrl = fileInfo.Link.Trim();
    }

    public static async Task ApplyCoverLinksAsync(
        IEnumerable<BlogPostSummaryDto> items,
        IFileManagerTool fileManagerTool,
        CancellationToken cancellationToken)
    {
        foreach (var item in items)
            await ApplyCoverLinkAsync(item, fileManagerTool, cancellationToken);
    }
}

using Microsoft.EntityFrameworkCore;

namespace NegareshAI.Api.Application.Common.Pagination;

public sealed record PageRequest(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    string? SortBy = null,
    bool SortDescending = false)
{
    public int SafePageNumber => Math.Max(1, PageNumber);
    public int SafePageSize => Math.Clamp(PageSize, 1, 100);
}

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasPreviousPage,
    bool HasNextPage);

public static class PaginationExtensions
{
    public static async Task<PagedResponse<T>> ToPagedResponseAsync<T>(
        this IQueryable<T> query, PageRequest page, CancellationToken cancellationToken)
    {
        var pageNumber = page.SafePageNumber;
        var pageSize = page.SafePageSize;
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize)
            .Take(pageSize).ToListAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return new(items, pageNumber, pageSize, totalCount, totalPages,
            pageNumber > 1, pageNumber < totalPages);
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Settings.Queries;

public sealed record ListRuntimeSettingsQuery(
    string? Category, int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<RuntimeSettingResponse>>;

public sealed class ListRuntimeSettingsQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant)
    : IRequestHandler<ListRuntimeSettingsQuery, PagedResponse<RuntimeSettingResponse>>
{
    public async Task<PagedResponse<RuntimeSettingResponse>> Handle(
        ListRuntimeSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.RuntimeSettings.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId);
        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(item => item.Category == request.Category.Trim());

        return await query.OrderBy(item => item.Category).ThenBy(item => item.Key)
            .Select(item => new RuntimeSettingResponse(
                item.Id, item.Category, item.Key, item.ValueJson,
                item.Version, item.IsActive, item.UpdatedAtUtc))
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
    }
}

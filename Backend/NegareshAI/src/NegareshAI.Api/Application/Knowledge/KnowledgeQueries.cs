using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Knowledge;

public sealed record ListDocumentGroupsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<DocumentGroupResponse>>;

public sealed class ListDocumentGroupsQueryHandler(
    NegareshDbContext db, ICurrentTenant tenant, IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ListDocumentGroupsQuery, PagedResponse<DocumentGroupResponse>>
{
    public async Task<PagedResponse<DocumentGroupResponse>> Handle(
        ListDocumentGroupsQuery request, CancellationToken cancellationToken)
    {
        var query = db.DocumentGroups.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId);
        if (authorizer is not null)
        {
            var allowed = await authorizer.GetAllowedResourceIdsAsync(
                DataScopeResourceType.DocumentGroup, cancellationToken);
            if (allowed is not null) query = query.Where(item => allowed.Contains(item.Id));
        }
        return await query.OrderBy(item => item.Name)
            .Select(item => new DocumentGroupResponse(
                item.Id, item.Name, item.Description, item.IsActive,
                item.Members.Select(member => member.DocumentId).ToArray(),
                item.CreatedAtUtc))
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
    }
}

public sealed record ListRuleSetsQuery(
    Guid? DocumentGroupId, int PageNumber = 1, int PageSize = 20)
    : IRequest<PagedResponse<RuleSetResponse>>;

public sealed class ListRuleSetsQueryHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListRuleSetsQuery, PagedResponse<RuleSetResponse>>
{
    public async Task<PagedResponse<RuleSetResponse>> Handle(
        ListRuleSetsQuery request, CancellationToken cancellationToken)
    {
        var query = db.RuleSets.AsNoTracking()
            .Include(item => item.Rules).ThenInclude(item => item.Parameters)
            .Where(item => item.OrganizationId == tenant.OrganizationId);
        if (request.DocumentGroupId is not null)
            query = query.Where(item => item.DocumentGroupId == request.DocumentGroupId);
        var page = await query.OrderBy(item => item.Name)
            .ThenByDescending(item => item.Version)
            .ToPagedResponseAsync(
                new PageRequest(request.PageNumber, request.PageSize), cancellationToken);
        return new PagedResponse<RuleSetResponse>(
            page.Items.Select(KnowledgeMapping.ToResponse).ToArray(),
            page.PageNumber, page.PageSize, page.TotalCount, page.TotalPages,
            page.HasPreviousPage, page.HasNextPage);
    }
}

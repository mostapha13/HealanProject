using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Knowledge;

public sealed record ListDocumentGroupsQuery : IRequest<IReadOnlyList<DocumentGroupResponse>>;

public sealed class ListDocumentGroupsQueryHandler(
    NegareshDbContext db, ICurrentTenant tenant, IDataScopeAuthorizer? authorizer = null)
    : IRequestHandler<ListDocumentGroupsQuery, IReadOnlyList<DocumentGroupResponse>>
{
    public async Task<IReadOnlyList<DocumentGroupResponse>> Handle(
        ListDocumentGroupsQuery request, CancellationToken cancellationToken)
    {
        var groups = await db.DocumentGroups.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId)
            .OrderBy(item => item.Name)
            .ToListAsync(cancellationToken);
        if (authorizer is not null)
        {
            var visible = new List<DocumentGroup>();
            foreach (var group in groups)
                if (await authorizer.CanAccessAsync(
                        DataScopeResourceType.DocumentGroup, group.Id, cancellationToken))
                    visible.Add(group);
            groups = visible;
        }
        return groups.Select(item => new DocumentGroupResponse(
            item.Id, item.Name, item.Description, item.IsActive,
            item.Members.Select(member => member.DocumentId).ToArray(),
            item.CreatedAtUtc)).ToArray();
    }
}

public sealed record ListRuleSetsQuery(Guid? DocumentGroupId)
    : IRequest<IReadOnlyList<RuleSetResponse>>;

public sealed class ListRuleSetsQueryHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListRuleSetsQuery, IReadOnlyList<RuleSetResponse>>
{
    public async Task<IReadOnlyList<RuleSetResponse>> Handle(
        ListRuleSetsQuery request, CancellationToken cancellationToken)
    {
        var query = db.RuleSets.AsNoTracking()
            .Include(item => item.Rules).ThenInclude(item => item.Parameters)
            .Where(item => item.OrganizationId == tenant.OrganizationId);
        if (request.DocumentGroupId is not null)
            query = query.Where(item => item.DocumentGroupId == request.DocumentGroupId);
        return (await query.OrderBy(item => item.Name).ThenByDescending(item => item.Version)
            .ToListAsync(cancellationToken))
            .Select(KnowledgeMapping.ToResponse).ToArray();
    }
}

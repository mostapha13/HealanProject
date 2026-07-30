using System.Security.Claims;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Access;

public sealed record DataScopeRow(
    Guid Id, DataScopeResourceType ResourceType, Guid ResourceId,
    DataScopeSubjectType SubjectType, string SubjectId, bool IsDenied,
    string CreatedByUserId, DateTime CreatedAtUtc, string? UpdatedByUserId,
    DateTime? UpdatedAtUtc);

public sealed record ListDataScopeQuery(
    DataScopeResourceType? ResourceType,
    DataScopeSubjectType? SubjectType,
    string? SubjectId,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<PagedResponse<DataScopeRow>>;

public sealed record SaveDataScopeCommand(
    DataScopeResourceType ResourceType,
    DataScopeSubjectType SubjectType,
    string SubjectId,
    IReadOnlyCollection<Guid> GrantedResourceIds,
    IReadOnlyCollection<Guid> DeniedResourceIds) : IRequest<Unit>;

public sealed class ListDataScopeHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListDataScopeQuery, PagedResponse<DataScopeRow>>
{
    public async Task<PagedResponse<DataScopeRow>> Handle(
        ListDataScopeQuery request, CancellationToken cancellationToken)
    {
        var query = db.DataScopeAssignments.AsNoTracking()
            .Where(x => x.OrganizationId == tenant.OrganizationId);
        if (request.ResourceType.HasValue)
            query = query.Where(x => x.ResourceType == request.ResourceType);
        if (request.SubjectType.HasValue)
            query = query.Where(x => x.SubjectType == request.SubjectType);
        if (!string.IsNullOrWhiteSpace(request.SubjectId))
            query = query.Where(x => x.SubjectId == request.SubjectId.Trim());
        return await query.OrderBy(x => x.ResourceType).ThenBy(x => x.ResourceId)
            .Select(x => new DataScopeRow(x.Id, x.ResourceType, x.ResourceId,
                x.SubjectType, x.SubjectId, x.IsDenied, x.CreatedByUserId,
                x.CreatedAtUtc, x.UpdatedByUserId, x.UpdatedAtUtc))
            .ToPagedResponseAsync(new PageRequest(request.PageNumber, request.PageSize),
                cancellationToken);
    }
}

public sealed class SaveDataScopeHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<SaveDataScopeCommand, Unit>
{
    public async Task<Unit> Handle(
        SaveDataScopeCommand request, CancellationToken cancellationToken)
    {
        var subjectId = request.SubjectId.Trim();
        if (string.IsNullOrWhiteSpace(subjectId))
            throw new ArgumentException("SubjectId is required.");
        var grants = request.GrantedResourceIds.Distinct().ToHashSet();
        var denies = request.DeniedResourceIds.Distinct().ToHashSet();
        if (grants.Overlaps(denies))
            throw new ArgumentException("A resource cannot be granted and denied simultaneously.");

        var rows = await db.DataScopeAssignments.IgnoreQueryFilters().Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.ResourceType == request.ResourceType
            && x.SubjectType == request.SubjectType
            && x.SubjectId == subjectId).ToListAsync(cancellationToken);
        var desired = grants.Concat(denies).ToHashSet();
        var now = DateTime.UtcNow;
        foreach (var resourceId in desired)
        {
            var row = rows.SingleOrDefault(x => x.ResourceId == resourceId);
            if (row == null)
            {
                row = new DataScopeAssignment
                {
                    OrganizationId = tenant.OrganizationId,
                    ResourceType = request.ResourceType,
                    ResourceId = resourceId,
                    SubjectType = request.SubjectType,
                    SubjectId = subjectId,
                    CreatedByUserId = tenant.UserId
                };
                db.DataScopeAssignments.Add(row);
            }
            row.IsDenied = denies.Contains(resourceId);
            row.IsDeleted = false;
            row.DeletedAtUtc = null;
            row.DeletedByUserId = null;
            row.UpdatedAtUtc = now;
            row.UpdatedByUserId = tenant.UserId;
        }
        foreach (var row in rows.Where(x => !desired.Contains(x.ResourceId) && !x.IsDeleted))
        {
            row.IsDeleted = true;
            row.DeletedAtUtc = now;
            row.DeletedByUserId = tenant.UserId;
        }
        audit.Add("data-scope.updated", nameof(DataScopeAssignment), subjectId,
            new { request.ResourceType, request.SubjectType, grants, denies });
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

public interface IDataScopeAuthorizer
{
    Task<bool> CanAccessAsync(
        DataScopeResourceType resourceType, Guid resourceId,
        CancellationToken cancellationToken = default);
    Task<IReadOnlySet<Guid>?> GetAllowedResourceIdsAsync(
        DataScopeResourceType resourceType,
        CancellationToken cancellationToken = default);
}

public sealed class DataScopeAuthorizer(
    NegareshDbContext db, ICurrentTenant tenant, IHttpContextAccessor accessor)
    : IDataScopeAuthorizer
{
    public async Task<bool> CanAccessAsync(
        DataScopeResourceType resourceType, Guid resourceId,
        CancellationToken cancellationToken = default)
    {
        var principal = accessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true) return false;
        var roles = principal.FindAll(ClaimTypes.Role).Select(x => x.Value)
            .Concat(principal.FindAll("role").Select(x => x.Value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roles.Contains("Admin")) return true;

        var userRows = await db.DataScopeAssignments.AsNoTracking().Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.ResourceType == resourceType && x.ResourceId == resourceId
            && x.SubjectType == DataScopeSubjectType.User
            && x.SubjectId == tenant.UserId).ToListAsync(cancellationToken);
        if (userRows.Any(x => x.IsDenied)) return false;
        if (userRows.Any(x => !x.IsDenied)) return true;
        if (roles.Count == 0) return false;
        var roleRows = await db.DataScopeAssignments.AsNoTracking().Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.ResourceType == resourceType && x.ResourceId == resourceId
            && x.SubjectType == DataScopeSubjectType.Role
            && roles.Contains(x.SubjectId)).ToListAsync(cancellationToken);
        return roleRows.Count > 0 && !roleRows.Any(x => x.IsDenied);
    }

    public async Task<IReadOnlySet<Guid>?> GetAllowedResourceIdsAsync(
        DataScopeResourceType resourceType,
        CancellationToken cancellationToken = default)
    {
        var principal = accessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true) return new HashSet<Guid>();
        var roles = principal.FindAll(ClaimTypes.Role).Select(x => x.Value)
            .Concat(principal.FindAll("role").Select(x => x.Value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roles.Contains("Admin")) return null;
        var rows = await db.DataScopeAssignments.AsNoTracking().Where(x =>
            x.OrganizationId == tenant.OrganizationId
            && x.ResourceType == resourceType
            && ((x.SubjectType == DataScopeSubjectType.User
                    && x.SubjectId == tenant.UserId)
                || (x.SubjectType == DataScopeSubjectType.Role
                    && roles.Contains(x.SubjectId))))
            .ToListAsync(cancellationToken);
        var allowed = new HashSet<Guid>();
        foreach (var resourceRows in rows.GroupBy(x => x.ResourceId))
        {
            var user = resourceRows.SingleOrDefault(
                x => x.SubjectType == DataScopeSubjectType.User);
            if (user is not null)
            {
                if (!user.IsDenied) allowed.Add(resourceRows.Key);
                continue;
            }
            var roleRows = resourceRows.Where(
                x => x.SubjectType == DataScopeSubjectType.Role).ToArray();
            if (roleRows.Length > 0 && roleRows.All(x => !x.IsDenied))
                allowed.Add(resourceRows.Key);
        }
        return allowed;
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Queries;

public sealed record ListContractsQuery(
    string? Search,
    ContractStatus? Status,
    int Page = 1,
    int PageSize = 20) : IRequest<ContractListResponse>;

public sealed class ListContractsQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant) : IRequestHandler<ListContractsQuery, ContractListResponse>
{
    public async Task<ContractListResponse> Handle(
        ListContractsQuery request,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);
        var query = db.Contracts.AsNoTracking()
            .Where(item => item.OrganizationId == tenant.OrganizationId);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(item => item.Subject.Contains(search)
                || (item.ContractNumber != null && item.ContractNumber.Contains(search)));
        }
        if (request.Status is not null)
            query = query.Where(item => item.Status == request.Status);

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(item => item.UpdatedAtUtc)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(item => new ContractListItemResponse(
                item.Id, item.DocumentId, item.Subject, item.ContractNumber,
                item.Status, item.Amount, item.Currency, item.StartDate,
                item.EndDate, item.Parties.Count, item.UpdatedAtUtc))
            .ToListAsync(cancellationToken);
        return new ContractListResponse(items, page, pageSize, total);
    }
}

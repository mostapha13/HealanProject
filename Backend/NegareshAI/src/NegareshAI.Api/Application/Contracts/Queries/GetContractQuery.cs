using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Queries;

public sealed record GetContractQuery(Guid Id) : IRequest<ContractDetailResponse?>;

public sealed class GetContractQueryHandler(
    NegareshDbContext db,
    ICurrentTenant tenant) : IRequestHandler<GetContractQuery, ContractDetailResponse?>
{
    public async Task<ContractDetailResponse?> Handle(
        GetContractQuery request,
        CancellationToken cancellationToken) =>
        await db.Contracts.AsNoTracking()
            .Where(item => item.Id == request.Id
                && item.OrganizationId == tenant.OrganizationId)
            .Select(item => new ContractDetailResponse(
                item.Id, item.DocumentId, item.Subject, item.ContractNumber,
                item.Status, item.Amount, item.Currency, item.StartDate, item.EndDate,
                item.InternalOwnerUserId,
                item.Parties.OrderBy(party => party.Role).Select(party =>
                    new ContractPartyResponse(party.Id, party.Role, party.Name,
                        party.NationalIdentifier, party.RepresentativeName)).ToList(),
                item.CreatedAtUtc, item.UpdatedAtUtc))
            .SingleOrDefaultAsync(cancellationToken);
}

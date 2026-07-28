using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Commands;

public sealed record CreateContractCommand(SaveContractRequest Request)
    : IRequest<ContractDetailResponse?>;
public sealed record UpdateContractCommand(Guid Id, SaveContractRequest Request)
    : IRequest<ContractDetailResponse?>;
public sealed record ArchiveContractCommand(Guid Id) : IRequest<bool>;

public sealed class CreateContractCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<CreateContractCommand, ContractDetailResponse?>
{
    public async Task<ContractDetailResponse?> Handle(
        CreateContractCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var documentExists = await db.Documents.AnyAsync(item =>
            item.Id == request.DocumentId
            && item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (!documentExists || await db.Contracts.AnyAsync(item =>
            item.DocumentId == request.DocumentId, cancellationToken))
            return null;

        var contract = new Contract
        {
            OrganizationId = tenant.OrganizationId,
            DocumentId = request.DocumentId,
            Subject = request.Subject.Trim(),
            ContractNumber = Normalize(request.ContractNumber),
            Status = request.Status,
            Amount = request.Amount,
            Currency = request.Currency.Trim().ToUpperInvariant(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            InternalOwnerUserId = Normalize(request.InternalOwnerUserId)
        };
        AddParties(contract, request.Parties);
        db.Contracts.Add(contract);
        audit.Add("contract.created", nameof(Contract), contract.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return Map(contract);
    }

    internal static void AddParties(Contract contract, IEnumerable<ContractPartyRequest> parties)
    {
        foreach (var party in parties.Where(item => !string.IsNullOrWhiteSpace(item.Name)))
            contract.Parties.Add(new ContractParty
            {
                Role = party.Role,
                Name = party.Name.Trim(),
                NationalIdentifier = Normalize(party.NationalIdentifier),
                RepresentativeName = Normalize(party.RepresentativeName)
            });
    }

    internal static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    internal static ContractDetailResponse Map(Contract item) =>
        new(item.Id, item.DocumentId, item.Subject, item.ContractNumber,
            item.Status, item.Amount, item.Currency, item.StartDate, item.EndDate,
            item.InternalOwnerUserId,
            item.Parties.OrderBy(party => party.Role).Select(party =>
                new ContractPartyResponse(party.Id, party.Role, party.Name,
                    party.NationalIdentifier, party.RepresentativeName)).ToList(),
            item.CreatedAtUtc, item.UpdatedAtUtc);
}

public sealed class UpdateContractCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<UpdateContractCommand, ContractDetailResponse?>
{
    public async Task<ContractDetailResponse?> Handle(
        UpdateContractCommand command, CancellationToken cancellationToken)
    {
        var contract = await db.Contracts.Include(item => item.Parties)
            .SingleOrDefaultAsync(item => item.Id == command.Id
                && item.OrganizationId == tenant.OrganizationId, cancellationToken);
        if (contract is null)
            return null;
        var request = command.Request;
        if (request.DocumentId != contract.DocumentId)
            return null;
        contract.Subject = request.Subject.Trim();
        contract.ContractNumber = CreateContractCommandHandler.Normalize(request.ContractNumber);
        contract.Status = request.Status;
        contract.Amount = request.Amount;
        contract.Currency = request.Currency.Trim().ToUpperInvariant();
        contract.StartDate = request.StartDate;
        contract.EndDate = request.EndDate;
        contract.InternalOwnerUserId =
            CreateContractCommandHandler.Normalize(request.InternalOwnerUserId);
        contract.UpdatedAtUtc = DateTime.UtcNow;
        db.ContractParties.RemoveRange(contract.Parties);
        contract.Parties.Clear();
        CreateContractCommandHandler.AddParties(contract, request.Parties);
        db.ContractParties.AddRange(contract.Parties);
        audit.Add("contract.updated", nameof(Contract), contract.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return CreateContractCommandHandler.Map(contract);
    }
}

public sealed class ArchiveContractCommandHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<ArchiveContractCommand, bool>
{
    public async Task<bool> Handle(
        ArchiveContractCommand command, CancellationToken cancellationToken)
    {
        var contract = await db.Contracts.SingleOrDefaultAsync(item =>
            item.Id == command.Id && item.OrganizationId == tenant.OrganizationId,
            cancellationToken);
        if (contract is null) return false;
        contract.Status = ContractStatus.Archived;
        contract.UpdatedAtUtc = DateTime.UtcNow;
        audit.Add("contract.archived", nameof(Contract), contract.Id.ToString());
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

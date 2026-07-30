using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Application.Common.Pagination;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Catalog;

public sealed record ListContractCatalogQuery(
    string Kind, int PageNumber = 1, int PageSize = 20) : IRequest<object>;
public sealed record SaveContractCatalogCommand(string Kind, Guid? Id, object Request) : IRequest<object?>;
public sealed record DeleteContractCatalogCommand(string Kind, Guid Id) : IRequest<bool>;

public sealed class ListContractCatalogHandler(NegareshDbContext db, ICurrentTenant tenant)
    : IRequestHandler<ListContractCatalogQuery, object>
{
    public async Task<object> Handle(ListContractCatalogQuery query, CancellationToken ct) =>
        query.Kind switch
        {
            "statuses" => await db.ContractStatusDefinitions.AsNoTracking()
                .Where(x => x.OrganizationId == tenant.OrganizationId && !x.IsDeleted)
                .OrderBy(x => x.Order).Select(x => new ContractStatusDefinitionResponse(
                    x.Id, x.Name, x.Order, x.Color, x.IsActive))
                .ToPagedResponseAsync(new PageRequest(query.PageNumber, query.PageSize), ct),
            "base-documents" => await db.ContractBaseDocumentProfiles.AsNoTracking()
                .Where(x => x.OrganizationId == tenant.OrganizationId && !x.IsDeleted)
                .OrderBy(x => x.Name).Select(x => new ContractBaseDocumentResponse(
                    x.Id, x.DocumentId, x.Name, x.Document!.Title, x.Description, x.IsActive))
                .ToPagedResponseAsync(new PageRequest(query.PageNumber, query.PageSize), ct),
            "parties" => await db.OrganizationParties.AsNoTracking()
                .Where(x => x.OrganizationId == tenant.OrganizationId && !x.IsDeleted)
                .OrderBy(x => x.Name).Select(x => new OrganizationPartyResponse(
                    x.Id, x.Name, x.NationalIdentifier, x.RepresentativeName,
                    x.ContactInfo, x.IsActive))
                .ToPagedResponseAsync(new PageRequest(query.PageNumber, query.PageSize), ct),
            _ => new PagedResponse<object>(
                [], 1, Math.Clamp(query.PageSize, 1, 100), 0, 0, false, false)
        };
}

public sealed class SaveContractCatalogHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<SaveContractCatalogCommand, object?>
{
    public async Task<object?> Handle(SaveContractCatalogCommand command, CancellationToken ct)
    {
        object? result = command.Kind switch
        {
            "statuses" => await SaveStatus(command, ct),
            "base-documents" => await SaveBaseDocument(command, ct),
            "parties" => await SaveParty(command, ct),
            _ => null
        };
        if (result is null) return null;
        audit.Add($"contract-catalog.{command.Kind}.saved", "ContractCatalog",
            command.Id?.ToString());
        await db.SaveChangesAsync(ct);
        return result;
    }

    private async Task<object?> SaveStatus(SaveContractCatalogCommand command, CancellationToken ct)
    {
        var request = (SaveContractStatusDefinitionRequest)command.Request;
        var item = command.Id.HasValue ? await db.ContractStatusDefinitions.SingleOrDefaultAsync(
            x => x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct) : null;
        if (command.Id.HasValue && item is null) return null;
        item ??= new ContractStatusDefinition { OrganizationId = tenant.OrganizationId, Name = "", CreatedByUserId = tenant.UserId };
        item.Name = request.Name.Trim(); item.Order = request.Order;
        item.Color = string.IsNullOrWhiteSpace(request.Color) ? "#6658df" : request.Color;
        item.IsActive = request.IsActive;
        if (command.Id.HasValue) { item.UpdatedAtUtc = DateTime.UtcNow; item.UpdatedByUserId = tenant.UserId; }
        if (!command.Id.HasValue) db.ContractStatusDefinitions.Add(item);
        return new ContractStatusDefinitionResponse(item.Id, item.Name, item.Order, item.Color, item.IsActive);
    }

    private async Task<object?> SaveBaseDocument(SaveContractCatalogCommand command, CancellationToken ct)
    {
        var request = (SaveContractBaseDocumentRequest)command.Request;
        if (!await db.Documents.AnyAsync(x => x.Id == request.DocumentId &&
            x.OrganizationId == tenant.OrganizationId, ct)) return null;
        var item = command.Id.HasValue ? await db.ContractBaseDocumentProfiles.SingleOrDefaultAsync(
            x => x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct) : null;
        if (command.Id.HasValue && item is null) return null;
        item ??= new ContractBaseDocumentProfile {
            OrganizationId = tenant.OrganizationId, Name = "", DocumentId = request.DocumentId,
            CreatedByUserId = tenant.UserId };
        item.DocumentId = request.DocumentId; item.Name = request.Name.Trim();
        item.Description = request.Description?.Trim(); item.IsActive = request.IsActive;
        if (command.Id.HasValue) { item.UpdatedAtUtc = DateTime.UtcNow; item.UpdatedByUserId = tenant.UserId; }
        if (!command.Id.HasValue) db.ContractBaseDocumentProfiles.Add(item);
        var title = await db.Documents.Where(x => x.Id == request.DocumentId)
            .Select(x => x.Title).SingleAsync(ct);
        return new ContractBaseDocumentResponse(item.Id, item.DocumentId, item.Name,
            title, item.Description, item.IsActive);
    }

    private async Task<object?> SaveParty(SaveContractCatalogCommand command, CancellationToken ct)
    {
        var request = (SaveOrganizationPartyRequest)command.Request;
        var item = command.Id.HasValue ? await db.OrganizationParties.SingleOrDefaultAsync(
            x => x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct) : null;
        if (command.Id.HasValue && item is null) return null;
        item ??= new OrganizationParty { OrganizationId = tenant.OrganizationId, Name = "", CreatedByUserId = tenant.UserId };
        item.Name = request.Name.Trim(); item.NationalIdentifier = request.NationalIdentifier?.Trim();
        item.RepresentativeName = request.RepresentativeName?.Trim();
        item.ContactInfo = request.ContactInfo?.Trim(); item.IsActive = request.IsActive;
        if (command.Id.HasValue) { item.UpdatedAtUtc = DateTime.UtcNow; item.UpdatedByUserId = tenant.UserId; }
        if (!command.Id.HasValue) db.OrganizationParties.Add(item);
        return new OrganizationPartyResponse(item.Id, item.Name, item.NationalIdentifier,
            item.RepresentativeName, item.ContactInfo, item.IsActive);
    }
}

public sealed class DeleteContractCatalogHandler(
    NegareshDbContext db, ICurrentTenant tenant, IAuditWriter audit)
    : IRequestHandler<DeleteContractCatalogCommand, bool>
{
    public async Task<bool> Handle(DeleteContractCatalogCommand command, CancellationToken ct)
    {
        object? item = command.Kind switch {
            "statuses" => await db.ContractStatusDefinitions.SingleOrDefaultAsync(x =>
                x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct),
            "base-documents" => await db.ContractBaseDocumentProfiles.SingleOrDefaultAsync(x =>
                x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct),
            "parties" => await db.OrganizationParties.SingleOrDefaultAsync(x =>
                x.Id == command.Id && x.OrganizationId == tenant.OrganizationId && !x.IsDeleted, ct),
            _ => null
        };
        if (item is null) return false;
        var now = DateTime.UtcNow;
        switch (item)
        {
            case ContractStatusDefinition value:
                value.IsDeleted = true; value.IsActive = false; value.DeletedAtUtc = now; value.DeletedByUserId = tenant.UserId; break;
            case ContractBaseDocumentProfile value:
                value.IsDeleted = true; value.IsActive = false; value.DeletedAtUtc = now; value.DeletedByUserId = tenant.UserId; break;
            case OrganizationParty value:
                value.IsDeleted = true; value.IsActive = false; value.DeletedAtUtc = now; value.DeletedByUserId = tenant.UserId; break;
        }
        audit.Add($"contract-catalog.{command.Kind}.deleted",
            "ContractCatalog", command.Id.ToString());
        await db.SaveChangesAsync(ct);
        return true;
    }
}

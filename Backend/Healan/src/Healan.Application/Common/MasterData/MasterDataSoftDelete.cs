using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Entities;
using Share.Domain.Exceptions;

namespace Healan.Application.Common.MasterData;

public enum MasterDataType
{
    Company,
    InsuranceCompany,
    InsuranceContract,
    ServiceType,
    MedicalFeeService,
    PortalContentItem,
    BlogPost,
    PatientReview,
    RagKnowledgeItem,
}

public sealed class MasterDataDeletedItemDto
{
    public long Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}

public sealed class MasterDataDeletedListQuery : IRequest<IReadOnlyList<MasterDataDeletedItemDto>>
{
    public MasterDataType Type { get; set; }
}

public sealed class MasterDataDeletedListQueryHandler
    : IRequestHandler<MasterDataDeletedListQuery, IReadOnlyList<MasterDataDeletedItemDto>>
{
    private readonly IApplicationDbContext _db;

    public MasterDataDeletedListQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<MasterDataDeletedItemDto>> Handle(
        MasterDataDeletedListQuery request,
        CancellationToken cancellationToken)
    {
        return request.Type switch
        {
            MasterDataType.Company => await Deleted(_db.Companies, x => new MasterDataDeletedItemDto
            {
                Id = x.CompanyId, DisplayName = x.CompanyName, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.InsuranceCompany => await Deleted(_db.InsuranceCompanies, x => new MasterDataDeletedItemDto
            {
                Id = x.InsuranceCompanyId, DisplayName = x.Name, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.InsuranceContract => await Deleted(_db.InsuranceContracts, x => new MasterDataDeletedItemDto
            {
                Id = x.InsuranceContractId, DisplayName = x.ContractNumber ?? string.Empty,
                DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.ServiceType => await Deleted(_db.ServiceTypes, x => new MasterDataDeletedItemDto
            {
                Id = x.ServiceTypeId, DisplayName = x.Title, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.MedicalFeeService => await Deleted(_db.MedicalFeeServices, x => new MasterDataDeletedItemDto
            {
                Id = x.MedicalFeeServiceId, DisplayName = string.Empty,
                DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.PortalContentItem => await Deleted(_db.PortalContentItems, x => new MasterDataDeletedItemDto
            {
                Id = x.PortalContentItemId, DisplayName = x.Title ?? string.Empty,
                DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.BlogPost => await Deleted(_db.BlogPosts, x => new MasterDataDeletedItemDto
            {
                Id = x.BlogPostId, DisplayName = x.Title, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.PatientReview => await Deleted(_db.PatientReviews, x => new MasterDataDeletedItemDto
            {
                Id = x.PatientReviewId, DisplayName = x.DisplayName, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            MasterDataType.RagKnowledgeItem => await Deleted(_db.RagKnowledgeItems, x => new MasterDataDeletedItemDto
            {
                Id = x.RagKnowledgeItemId, DisplayName = x.Question, DeletedAt = x.DeletedAt, DeletedBy = x.DeletedBy,
            }, cancellationToken),
            _ => throw new BadRequestExceptions("نوع داده اصلی معتبر نیست"),
        };
    }

    private static async Task<IReadOnlyList<MasterDataDeletedItemDto>> Deleted<TEntity>(
        IQueryable<TEntity> source,
        System.Linq.Expressions.Expression<Func<TEntity, MasterDataDeletedItemDto>> selector,
        CancellationToken cancellationToken)
        where TEntity : AuditableEntity
    {
        return await source
            .IgnoreQueryFilters()
            .Where(x => x.IsDeleted || x.DeletedAt != null)
            .OrderByDescending(x => x.DeletedAt)
            .Select(selector)
            .ToListAsync(cancellationToken);
    }
}

public sealed class MasterDataRestoreCommand : IRequest<MasterDataDeletedItemDto>
{
    public MasterDataType Type { get; set; }
    public long Id { get; set; }
}

public sealed class MasterDataItemRequest
{
    public long Id { get; set; }
}

public sealed class MasterDataDeleteCommand : IRequest<MasterDataDeletedItemDto>
{
    public MasterDataType Type { get; set; }
    public long Id { get; set; }
}

public sealed class MasterDataDeleteCommandHandler
    : IRequestHandler<MasterDataDeleteCommand, MasterDataDeletedItemDto>
{
    private readonly IApplicationDbContext _db;

    public MasterDataDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<MasterDataDeletedItemDto> Handle(
        MasterDataDeleteCommand request,
        CancellationToken cancellationToken)
    {
        switch (request.Type)
        {
            case MasterDataType.Company:
                if (await _db.Doctors.AnyAsync(x => x.CompanyId == request.Id, cancellationToken) ||
                    await _db.Users.AnyAsync(x => x.CompanyId == request.Id, cancellationToken) ||
                    await _db.Companies.AnyAsync(x => x.ParentCompanyRef == request.Id, cancellationToken))
                    throw new BadRequestExceptions("شرکت در اطلاعات کاربران، پزشکان یا شرکت‌های زیرمجموعه استفاده شده و قابل حذف نیست");
                _db.Companies.Remove(await Active(_db.Companies, x => x.CompanyId == request.Id, cancellationToken));
                break;

            case MasterDataType.InsuranceCompany:
                if (await _db.Appointments.AnyAsync(
                        x => x.PrimaryInsuranceCompanyId == request.Id || x.SecondInsuranceCompanyId == request.Id,
                        cancellationToken))
                    throw new BadRequestExceptions("بیمه در نوبت‌ها استفاده شده و قابل حذف نیست");
                var contracts = await _db.InsuranceContracts
                    .Where(x => x.InsuranceCompanyId == request.Id)
                    .ToListAsync(cancellationToken);
                foreach (var contract in contracts)
                    await DeleteContract(contract, cancellationToken);
                _db.InsuranceCompanies.Remove(await Active(
                    _db.InsuranceCompanies, x => x.InsuranceCompanyId == request.Id, cancellationToken));
                break;

            case MasterDataType.InsuranceContract:
                await DeleteContract(
                    await Active(_db.InsuranceContracts, x => x.InsuranceContractId == request.Id, cancellationToken),
                    cancellationToken);
                break;

            case MasterDataType.MedicalFeeService:
                _db.MedicalFeeServices.Remove(await Active(
                    _db.MedicalFeeServices, x => x.MedicalFeeServiceId == request.Id, cancellationToken));
                break;

            default:
                throw new BadRequestExceptions("حذف این نوع داده از مسیر اختصاصی آن انجام می‌شود");
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new MasterDataDeletedItemDto { Id = request.Id };
    }

    private async Task DeleteContract(
        Healan.Domain.Insurances.Entities.InsuranceContract contract,
        CancellationToken cancellationToken)
    {
        var services = await _db.InsuranceContractServices
            .Where(x => x.InsuranceContractId == contract.InsuranceContractId)
            .ToListAsync(cancellationToken);
        var serviceIds = services.Select(x => x.InsuranceContractServiceId).ToList();
        if (await _db.InvoiceItems.AnyAsync(
                x => x.InsuranceContractServiceId != null &&
                     serviceIds.Contains(x.InsuranceContractServiceId.Value),
                cancellationToken))
            throw new BadRequestExceptions("قرارداد بیمه در فاکتورها استفاده شده و قابل حذف نیست");

        foreach (var service in services)
            service.IsDeleted = true;
        contract.IsDeleted = true;
    }

    private static async Task<TEntity> Active<TEntity>(
        IQueryable<TEntity> source,
        System.Linq.Expressions.Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken)
        where TEntity : AuditableEntity
    {
        return await source.FirstOrDefaultAsync(predicate, cancellationToken)
            ?? throw new NotFoundExceptions("رکورد یافت نشد");
    }
}

public sealed class MasterDataRestoreCommandHandler
    : IRequestHandler<MasterDataRestoreCommand, MasterDataDeletedItemDto>
{
    private readonly IApplicationDbContext _db;

    public MasterDataRestoreCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<MasterDataDeletedItemDto> Handle(
        MasterDataRestoreCommand request,
        CancellationToken cancellationToken)
    {
        AuditableEntity entity = request.Type switch
        {
            MasterDataType.Company => await Find(_db.Companies, x => x.CompanyId == request.Id, cancellationToken),
            MasterDataType.InsuranceCompany => await Find(_db.InsuranceCompanies, x => x.InsuranceCompanyId == request.Id, cancellationToken),
            MasterDataType.InsuranceContract => await Find(_db.InsuranceContracts, x => x.InsuranceContractId == request.Id, cancellationToken),
            MasterDataType.ServiceType => await Find(_db.ServiceTypes, x => x.ServiceTypeId == request.Id, cancellationToken),
            MasterDataType.MedicalFeeService => await Find(_db.MedicalFeeServices, x => x.MedicalFeeServiceId == request.Id, cancellationToken),
            MasterDataType.PortalContentItem => await Find(_db.PortalContentItems, x => x.PortalContentItemId == request.Id, cancellationToken),
            MasterDataType.BlogPost => await Find(_db.BlogPosts, x => x.BlogPostId == request.Id, cancellationToken),
            MasterDataType.PatientReview => await Find(_db.PatientReviews, x => x.PatientReviewId == request.Id, cancellationToken),
            MasterDataType.RagKnowledgeItem => await Find(_db.RagKnowledgeItems, x => x.RagKnowledgeItemId == request.Id, cancellationToken),
            _ => throw new BadRequestExceptions("نوع داده اصلی معتبر نیست"),
        };

        if (!entity.IsDeleted && entity.DeletedAt == null)
            throw new BadRequestExceptions("رکورد حذف نشده است");

        if (request.Type == MasterDataType.ServiceType)
        {
            var fees = await _db.MedicalFeeServices
                .IgnoreQueryFilters()
                .Where(x => x.ServiceTypeId == request.Id && (x.IsDeleted || x.DeletedAt != null))
                .ToListAsync(cancellationToken);
            foreach (var fee in fees)
                Restore(fee);
        }
        else if (request.Type == MasterDataType.InsuranceContract)
        {
            var services = await _db.InsuranceContractServices
                .IgnoreQueryFilters()
                .Where(x => x.InsuranceContractId == request.Id && (x.IsDeleted || x.DeletedAt != null))
                .ToListAsync(cancellationToken);
            foreach (var service in services)
                Restore(service);
        }
        else if (request.Type == MasterDataType.InsuranceCompany)
        {
            var contracts = await _db.InsuranceContracts
                .IgnoreQueryFilters()
                .Where(x => x.InsuranceCompanyId == request.Id && (x.IsDeleted || x.DeletedAt != null))
                .ToListAsync(cancellationToken);
            var contractIds = contracts.Select(x => x.InsuranceContractId).ToList();
            var services = await _db.InsuranceContractServices
                .IgnoreQueryFilters()
                .Where(x => contractIds.Contains(x.InsuranceContractId) && (x.IsDeleted || x.DeletedAt != null))
                .ToListAsync(cancellationToken);
            foreach (var service in services)
                Restore(service);
            foreach (var contract in contracts)
                Restore(contract);
        }

        var deletedAt = entity.DeletedAt;
        var deletedBy = entity.DeletedBy;
        Restore(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new MasterDataDeletedItemDto
        {
            Id = request.Id,
            DeletedAt = deletedAt,
            DeletedBy = deletedBy,
        };
    }

    private static void Restore(AuditableEntity entity)
    {
        entity.IsDeleted = false;
        entity.DeletedAt = null;
        entity.DeletedBy = null;
    }

    private static async Task<TEntity> Find<TEntity>(
        IQueryable<TEntity> source,
        System.Linq.Expressions.Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken)
        where TEntity : AuditableEntity
    {
        return await source.IgnoreQueryFilters().FirstOrDefaultAsync(predicate, cancellationToken)
            ?? throw new NotFoundExceptions("رکورد حذف‌شده یافت نشد");
    }
}

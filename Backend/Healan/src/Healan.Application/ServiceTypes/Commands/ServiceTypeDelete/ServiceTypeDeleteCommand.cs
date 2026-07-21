using Healan.Application.Common.Interfaces;
using Healan.Application.ServiceTypes.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.ServiceTypes.Commands.ServiceTypeDelete;

public class ServiceTypeDeleteCommand : IRequest<ServiceTypeResult>
{
    public long ServiceTypeId { get; set; }
}

public class ServiceTypeDeleteCommandHandler : IRequestHandler<ServiceTypeDeleteCommand, ServiceTypeResult>
{
    private readonly IApplicationDbContext _db;

    public ServiceTypeDeleteCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<ServiceTypeResult> Handle(ServiceTypeDeleteCommand request, CancellationToken cancellationToken)
    {
        var serviceType = await _db.ServiceTypes
            .FirstOrDefaultAsync(x => x.ServiceTypeId == request.ServiceTypeId, cancellationToken);

        if (serviceType == null)
            throw new BadRequestExceptions("خدمت یافت نشد");

        var hasAppointments = await _db.Appointments
            .AnyAsync(a => a.ServiceTypes.Any(s => s.ServiceTypeId == request.ServiceTypeId), cancellationToken);

        if (hasAppointments)
            throw new BadRequestExceptions("این خدمت در نوبت‌ها استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.");

        var hasInvoiceItems = await _db.InvoiceItems
            .AnyAsync(i => i.ServiceTypeId == request.ServiceTypeId, cancellationToken);

        if (hasInvoiceItems)
            throw new BadRequestExceptions("این خدمت در فاکتورها استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.");

        var hasInsuranceContracts = await _db.InsuranceContractServices
            .AnyAsync(i => i.ServiceTypeId == request.ServiceTypeId, cancellationToken);

        if (hasInsuranceContracts)
            throw new BadRequestExceptions("این خدمت در قرارداد بیمه استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.");

        var fees = await _db.MedicalFeeServices
            .Where(f => f.ServiceTypeId == request.ServiceTypeId)
            .ToListAsync(cancellationToken);

        foreach (var fee in fees)
            fee.IsDeleted = true;

        serviceType.IsDeleted = true;
        await _db.SaveChangesAsync(cancellationToken);

        return new ServiceTypeResult(Id: request.ServiceTypeId);
    }
}

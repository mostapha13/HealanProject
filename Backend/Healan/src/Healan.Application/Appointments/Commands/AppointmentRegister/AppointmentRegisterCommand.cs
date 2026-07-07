using AutoMapper;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Common.Services;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;

namespace Healan.Application.Appointments.Commands.AppointmentRegister;

public class AppointmentRegisterCommand : AppointmentRegisterRequest, IRequest<AppointmentRegisterResult>
{
}

public class AppointmentRegisterCommandHandler : IRequestHandler<AppointmentRegisterCommand, AppointmentRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IInvoiceCalculationService _invoiceCalculationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AppointmentRegisterCommandHandler> _logger;

    public AppointmentRegisterCommandHandler(
        IApplicationDbContext applicationDbContext,
        IInvoiceCalculationService invoiceCalculationService,
        ICurrentUserService currentUserService,
        ILogger<AppointmentRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _invoiceCalculationService = invoiceCalculationService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<AppointmentRegisterResult> Handle(AppointmentRegisterCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        request.serviceTypeIds ??= new List<long>();

        await _applicationDbContext.BeginTransactionAsync();

        var appointment = await _applicationDbContext.Appointments
            .Include(x => x.Invoices).ThenInclude(x => x.InvoiceItems)
            .Include(x => x.Invoices).ThenInclude(x => x.Payments)
            .Include(x => x.ServiceTypes)
            .FirstOrDefaultAsync(x => x.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null)
        {
            appointment = new Appointment();
            _applicationDbContext.Appointments.Add(appointment);
        }

        appointment.PatientId = request.PatientId;
        appointment.DoctorId = request.DoctorId;
        appointment.AppointmentDate = request.AppointmentDate ?? DateTime.Now;
        appointment.DurationMinutes = request.DurationMinutes;
        appointment.AppointmentTypeId = appointment.AppointmentId == 0
            ? AppointmentTypeId.Scheduled
            : appointment.AppointmentTypeId;
        appointment.Note = request.Note;
        appointment.PrimaryInsuranceCompanyId = request.PrimaryInsuranceCompanyId;
        appointment.ConfirmPrimaryInsuranceCompany = request.ConfirmPrimaryInsuranceCompany;
        appointment.SecondInsuranceCompanyId = request.SecondInsuranceCompanyId;
        appointment.ConfirmSecondInsuranceCompany = request.ConfirmSecondInsuranceCompany;

        var currentServiceTypeIds = appointment.ServiceTypes.Select(s => s.ServiceTypeId).ToList();
        foreach (var id in currentServiceTypeIds.Where(id => !request.serviceTypeIds.Contains(id)))
        {
            var service = appointment.ServiceTypes.First(s => s.ServiceTypeId == id);
            appointment.ServiceTypes.Remove(service);
        }

        var toAdd = request.serviceTypeIds.Where(id => !currentServiceTypeIds.Contains(id)).ToList();
        if (toAdd.Any())
        {
            var newServices = await _applicationDbContext.ServiceTypes
                .Where(s => toAdd.Contains(s.ServiceTypeId))
                .ToListAsync(cancellationToken);
            foreach (var service in newServices)
                appointment.ServiceTypes.Add(service);
        }

        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        var paidServiceTypeIds = appointment.Invoices
            .Where(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid)
            .SelectMany(i => i.InvoiceItems)
            .Select(ii => ii.ServiceTypeId)
            .ToHashSet();

        var serviceTypeIdsToBill = request.serviceTypeIds
            .Where(id => !paidServiceTypeIds.Contains(id))
            .ToList();

        var invoice = appointment.Invoices
            .FirstOrDefault(i => i.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending);

        if (invoice is not null)
        {
            _applicationDbContext.InvoiceItems.RemoveRange(invoice.InvoiceItems);
            _applicationDbContext.Payments.RemoveRange(invoice.Payments);
        }
        else if (serviceTypeIdsToBill.Any())
        {
            invoice = new Invoice { AppointmentId = appointment.AppointmentId };
            _applicationDbContext.Invoices.Add(invoice);
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
        }

        if (!serviceTypeIdsToBill.Any())
        {
            if (invoice is not null && invoice.InvoiceStatusTypeId == InvoiceStatusTypeId.Pending)
            {
                _applicationDbContext.InvoiceItems.RemoveRange(invoice.InvoiceItems);
                _applicationDbContext.Payments.RemoveRange(invoice.Payments);
                _applicationDbContext.Invoices.Remove(invoice);
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
            }

            await _applicationDbContext.CommitTransactionAsync();
            return new AppointmentRegisterResult(appointment.AppointmentId);
        }

        var medicalFeeServices = await _applicationDbContext.MedicalFeeServices
            .Where(x => x.IsActive)
            .ToListAsync(cancellationToken);

        decimal totalPrimary = 0;
        decimal totalSecondary = 0;
        decimal totalAmount = 0;

        foreach (var serviceTypeId in serviceTypeIdsToBill)
        {
            var medicalService = medicalFeeServices.FirstOrDefault(x => x.ServiceTypeId == serviceTypeId);
            if (medicalService is null)
            {
                _logger.LogError("تعرفه فعال برای {ServiceTypeId} یافت نشد", serviceTypeId);
                throw new NotFoundExceptions("تعرفه یافت نشد");
            }

            var calc = await _invoiceCalculationService.CalculateAsync(
                serviceTypeId,
                medicalService.Price,
                request.PrimaryInsuranceCompanyId,
                request.ConfirmPrimaryInsuranceCompany,
                request.SecondInsuranceCompanyId,
                request.ConfirmSecondInsuranceCompany,
                cancellationToken);

            invoice!.InvoiceItems.Add(new InvoiceItem
            {
                ServiceTypeId = serviceTypeId,
                UnitPrice = calc.UnitPrice,
                Quantity = 1,
                PrimaryInsuranceCovered = calc.PrimaryInsuranceCovered,
                SecondaryInsuranceCovered = calc.SecondaryInsuranceCovered,
                InsuranceContractServiceId = calc.InsuranceContractServiceId
            });

            totalAmount += calc.UnitPrice;
            totalPrimary += calc.PrimaryInsuranceCovered;
            totalSecondary += calc.SecondaryInsuranceCovered;
        }

        invoice!.InvoiceStatusTypeId = InvoiceStatusTypeId.Pending;
        invoice.TotalAmount = totalAmount;
        invoice.PrimaryInsuranceCovered = totalPrimary;
        invoice.SecondaryInsuranceCovered = totalSecondary;

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            await _applicationDbContext.CommitTransactionAsync();
        }
        catch (Exception ex)
        {
            await _applicationDbContext.RollbackTransactionAsync();
            _logger.LogError(ex, "AppointmentRegister failed");
            throw new BadRequestExceptions("خطا در ثبت نوبت");
        }

        return new AppointmentRegisterResult(appointment.AppointmentId);
    }
}

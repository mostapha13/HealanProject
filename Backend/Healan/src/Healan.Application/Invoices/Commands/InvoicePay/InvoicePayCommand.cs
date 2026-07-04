using Healan.Application.Common.Interfaces;
using Healan.Application.Invoices.Dtos;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Invoices.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;

namespace Healan.Application.Invoices.Commands.InvoicePay;

public class InvoicePayCommand : IRequest<InvoicePayResult>
{
    public long InvoiceId { get; set; }
    public string PaymentReference { get; set; } = string.Empty;
    public PaymentMethodTypeId PaymentMethodTypeId { get; set; } = PaymentMethodTypeId.Cash;
    public string? Description { get; set; }
}

public class InvoicePayCommandHandler : IRequestHandler<InvoicePayCommand, InvoicePayResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly ILogger<InvoicePayCommandHandler> _logger;

    public InvoicePayCommandHandler(
        IApplicationDbContext applicationDbContext,
        ILogger<InvoicePayCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _logger = logger;
    }

    public async Task<InvoicePayResult> Handle(InvoicePayCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _applicationDbContext.Invoices
            .Include(x => x.Appointment)
                .ThenInclude(x => x!.PrimaryInsuranceCompany!)
                    .ThenInclude(x => x.InsuranceContracts.Where(c => c.IsActive))
            .Include(x => x.Appointment)
                .ThenInclude(x => x!.SecondInsuranceCompany!)
                    .ThenInclude(x => x.InsuranceContracts.Where(c => c.IsActive))
            .FirstOrDefaultAsync(x => x.InvoiceId == request.InvoiceId, cancellationToken);

        if (invoice is null)
            throw new NotFoundExceptions("فاکتور یافت نشد");

        if (invoice.InvoiceStatusTypeId == InvoiceStatusTypeId.Paid)
            throw new BadRequestExceptions("این فاکتور قبلاً پرداخت شده است");

        var payment = await _applicationDbContext.Payments
            .FirstOrDefaultAsync(p => p.InvoiceId == invoice.InvoiceId, cancellationToken);

        if (payment is null)
        {
            payment = new Payment();
            _applicationDbContext.Payments.Add(payment);
        }

        payment.InvoiceId = invoice.InvoiceId;
        payment.TotalAmount = invoice.TotalAmount;
        payment.PatientShare = invoice.PatientPayable;
        payment.PrimaryInsuranceConvered = invoice.PrimaryInsuranceCovered;
        payment.SecondaryInsuranceCovered = invoice.SecondaryInsuranceCovered;
        payment.PrimaryInsuranceId = invoice.Appointment.PrimaryInsuranceCompanyId;
        payment.SecondaryInsuranceId = invoice.Appointment.SecondInsuranceCompanyId;
        payment.PrimaryInsuranceContractId = invoice.Appointment.PrimaryInsuranceCompany?
            .InsuranceContracts.Select(x => x.InsuranceContractId).FirstOrDefault();
        payment.SecondaryInsuranceContractId = invoice.Appointment.SecondInsuranceCompany?
            .InsuranceContracts.Select(x => x.InsuranceContractId).FirstOrDefault();
        payment.PaymentStatusTypeId = PaymentStatusTypeId.Completed;
        payment.PaymentDate = DateTime.Now;
        payment.PaymentReference = request.PaymentReference;
        payment.PaymentMethodTypeId = request.PaymentMethodTypeId;
        payment.Description = request.Description;

        invoice.InvoiceStatusTypeId = InvoiceStatusTypeId.Paid;
        await _applicationDbContext.SaveChangesAsync(cancellationToken);
        return new InvoicePayResult(payment.PaymentId);
    }
}

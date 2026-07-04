using FluentValidation;

namespace Healan.Application.Invoices.Commands.InvoicePay;

public class InvoicePayCommandValidator : AbstractValidator<InvoicePayCommand>
{
    public InvoicePayCommandValidator()
    {
        RuleFor(x => x.InvoiceId).GreaterThan(0).WithMessage("شناسه فاکتور نامعتبر است");
        RuleFor(x => x.PaymentReference).NotEmpty().WithMessage("شماره/مرجع پرداخت الزامی است").MaximumLength(100);
    }
}

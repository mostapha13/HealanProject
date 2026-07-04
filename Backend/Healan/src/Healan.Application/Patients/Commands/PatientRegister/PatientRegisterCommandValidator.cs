using FluentValidation;
using Healan.Application.Common.Interfaces;
using Healan.Application.Common.Validators;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Patients.Commands.PatientRegister;

public class PatientRegisterCommandValidator : AbstractValidator<PatientRegisterCommand>
{
    public PatientRegisterCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("نام الزامی است").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("نام خانوادگی الزامی است").MaximumLength(100);
        RuleFor(x => x.PhoneNumber).NotEmpty().WithMessage("شماره موبایل الزامی است").MaximumLength(50);

        RuleFor(x => x.NationalCode)
            .NotEmpty().WithMessage("کد ملی الزامی است")
            .Must(NationalCodeValidator.IsValid).WithMessage("کد ملی نامعتبر است");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
            {
                var exists = await db.Patients.AnyAsync(
                    p => p.NationalCode == cmd.NationalCode && p.PatientId != cmd.PatientId, ct);
                return !exists;
            })
            .WithMessage("بیماری با این کد ملی قبلاً ثبت شده است");
    }
}

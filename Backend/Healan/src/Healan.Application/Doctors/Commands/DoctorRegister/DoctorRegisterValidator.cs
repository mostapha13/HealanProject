using FluentValidation;
using Healan.Application.Common.Interfaces;
using Healan.Application.Common.Validators;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Doctors.Commands.DoctorRegister;

public class DoctorRegisterValidator : AbstractValidator<DoctorRegisterCommand>
{
    public DoctorRegisterValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("نام الزامی است").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("نام خانوادگی الزامی است").MaximumLength(100);
        RuleFor(x => x.Mobile).NotEmpty().WithMessage("شماره موبایل الزامی است").MaximumLength(15);
        RuleFor(x => x.MedicalGroupTypeId).IsInEnum().WithMessage("گروه پزشکی الزامی است");

        RuleFor(x => x.NationalCode)
            .NotEmpty().WithMessage("کد ملی الزامی است")
            .Must(NationalCodeValidator.IsValid).WithMessage("کد ملی نامعتبر است");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
            {
                var exists = await db.Doctors.AnyAsync(
                    d => d.NationalCode == cmd.NationalCode && d.DoctorId != cmd.DoctorId, ct);
                return !exists;
            })
            .WithMessage("پزشکی با این کد ملی قبلاً ثبت شده است");
    }
}

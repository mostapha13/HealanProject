using FluentValidation;
using Healan.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Appointments.Commands.AppointmentRegister;

public class AppointmentRegisterCommandValidator : AbstractValidator<AppointmentRegisterCommand>
{
    public AppointmentRegisterCommandValidator(IApplicationDbContext db)
    {
        RuleFor(x => x.PatientId).GreaterThan(0).WithMessage("بیمار را انتخاب کنید");
        RuleFor(x => x.DoctorId).GreaterThan(0).WithMessage("پزشک را انتخاب کنید");
        RuleFor(x => x.serviceTypeIds).NotNull().WithMessage("حداقل یک خدمت انتخاب کنید");
        RuleFor(x => x.serviceTypeIds).Must(s => s != null && s.Any()).WithMessage("حداقل یک خدمت انتخاب کنید");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                await db.Patients.AnyAsync(p => p.PatientId == cmd.PatientId, ct))
            .WithMessage("بیمار یافت نشد");

        RuleFor(x => x)
            .MustAsync(async (cmd, ct) =>
                await db.Doctors.AnyAsync(d => d.DoctorId == cmd.DoctorId, ct))
            .WithMessage("پزشک یافت نشد");
    }
}

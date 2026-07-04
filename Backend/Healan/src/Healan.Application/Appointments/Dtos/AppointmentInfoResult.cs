using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Insurances.Dtos;
using Healan.Application.Invoices.Dtos;
using Healan.Application.Patients.Dtos;
using Healan.Application.ServiceTypes.Dtos;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Share.Domain.Extensions;

namespace Healan.Application.Appointments.Dtos;

public class AppointmentInfoResult : IMapFrom<Appointment>
{
    public long AppointmentId { get; set; }
    public long PatientId { get; set; }
    public PatientDto Patient { get; set; }
    public long DoctorId { get; set; }
    public DoctorDto Doctor { get; set; }
    public DateTime AppointmentDate { get; set; }
    /// <summary>
    /// مدت زمان ویزیت
    /// </summary>
    public int? DurationMinutes { get; set; }
    /// <summary>
    /// وضعیت نوبت
    /// </summary>
    public AppointmentTypeId AppointmentTypeId { get; set; }
    public string AppointmentTypeName { get; set; }
    /// <summary>
    /// یادداشت مرکز
    /// </summary>
    public string? Note { get; set; }

    public long? PrimaryInsuranceCompanyId { get; set; }
    public InsuranceInfoResult? PrimaryInsuranceCompany { get; set; }
    public bool ConfirmPrimaryInsuranceCompany { get; set; }
    public long? SecondInsuranceCompanyId { get; set; }
    public InsuranceInfoResult? SecondInsuranceCompany { get; set; }
    public bool ConfirmSecondInsuranceCompany { get; set; }
    public ICollection<ServiceTypeDto> ServiceTypes { get; set; }
    public ICollection<InvoiceDto> Invoices { get; set; }
    public void Mapping(Profile profile)
    {
        profile.CreateMap<Appointment, AppointmentInfoResult>()
            .ForMember(a => a.AppointmentTypeName, b => b.MapFrom(c => c.AppointmentTypeId.GetDisplayName()));
    }
}


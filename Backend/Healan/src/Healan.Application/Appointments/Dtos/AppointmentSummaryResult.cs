using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Insurances.Dtos;
using Healan.Application.Patients.Dtos;
using Healan.Application.ServiceTypes.Dtos;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Dtos;
public class AppointmentSummaryResult : IMapFrom<Appointment>
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
    public ICollection<ServiceTypeDto> ServiceTypes  { get; set; }
    public List<Invoice> Invoices { get; set; }
    public long? PrescriptionId { get; set; }
    public bool HasEchoReport { get; set; }
    public bool PatientHasVisitHistory { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Appointment, AppointmentSummaryResult>()
            .ForMember(a => a.AppointmentTypeName, b => b.MapFrom(c => c.AppointmentTypeId.GetDisplayName()))
            .ForMember(a => a.PrimaryInsuranceCompany, b => b.MapFrom(c => c.PrimaryInsuranceCompany))
            .ForMember(a => a.Invoices, b => b.MapFrom(c => c.Invoices))
            .ForMember(a => a.SecondInsuranceCompany, b => b.MapFrom(c => c.SecondInsuranceCompany))
            .ForMember(a => a.PrescriptionId, b => b.MapFrom(c =>
                c.Prescriptions
                    .OrderByDescending(p => p.IssueDate)
                    .Select(p => (long?)p.PrescriptionId)
                    .FirstOrDefault()))
            .ForMember(a => a.HasEchoReport, b => b.MapFrom(c =>
                c.Prescriptions.Any(p => p.EchoReport != null)));
    }
}


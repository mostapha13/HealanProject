using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Companies.Dtos;
using Healan.Application.ServiceTypes.Dtos;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Appointments.Enums;
using Healan.Domain.MedicalFeeServices.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Dtos;
public class AppointmentRegisterRequest:IMapFrom<Appointment>
    {
    public long AppointmentId { get; set; }
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    /// <summary>
    /// تاریخ و ساعت نوبت (در صورت خالی = همین لحظه)
    /// </summary>
    public DateTime? AppointmentDate { get; set; }
    /// <summary>
    /// مدت زمان ویزیت
    /// </summary>
    public int? DurationMinutes { get; set; }
 
    /// <summary>
    /// یادداشت مرکز
    /// </summary>
    public string? Note { get; set; }

    public long? PrimaryInsuranceCompanyId { get; set; }
    public bool ConfirmPrimaryInsuranceCompany { get; set; }
    public long? SecondInsuranceCompanyId { get; set; }
    public bool ConfirmSecondInsuranceCompany { get; set; }

    public ICollection<long> serviceTypeIds { get; set; }
    public void Mapping(Profile profile)
    {
        profile.CreateMap<Appointment, AppointmentRegisterRequest>();
    }
}

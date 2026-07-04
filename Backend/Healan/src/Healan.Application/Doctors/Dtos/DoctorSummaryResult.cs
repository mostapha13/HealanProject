using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Doctors.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Doctors.Dtos;

public record DoctorSummaryResult:IMapFrom<Doctor>
{
    public long DoctorId { get; set; }
    public long CompanyId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName { get; set; }
    public string NationalCode { get; set; }
    public string? PersonnelNumber { get; set; }
    public string? PhoneNumber { get; set; }
    public string Mobile { get; set; }
    public DateTime? Birthdate { get; set; }
    public int MedicalSystemNumber { get; set; }
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }
    public string MedicalGroupTypeName { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Doctor, DoctorSummaryResult>()
            .ForMember(a => a.MedicalGroupTypeName, b => b.MapFrom(c => c.MedicalGroupTypeId.GetDisplayName()))
            .ForMember(a => a.FullName, b => b.MapFrom(c => $"{c.FirstName} {c.LastName}"))

            ;
    }
}
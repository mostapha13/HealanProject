using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Doctors.Dtos;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Patients.Entities;

namespace Healan.Application.Patients.Dtos;

public record PatientSummaryResult : IMapFrom<Patient>
{
    public long PatientId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string FullName { get; set; }
    public string NationalCode { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? Birthdate { get; set; }
    public void Mapping(Profile profile)
    {

        profile.CreateMap<Patient, PatientSummaryResult>()
            .ForMember(a => a.FullName, b => b.MapFrom(c => $"{c.FirstName} {c.LastName}"))

            ;
    }


}

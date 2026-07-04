using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Patients.Entities;
using Share.Domain.Extensions;

namespace Healan.Application.Patients.Dtos;

public record PatientInfoResult : IMapFrom<Patient>
{
    public long PatientId { get; set; }
    public long UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? Birthdate { get; set; }
   
}
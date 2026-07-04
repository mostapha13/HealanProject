using Healan.Domain.Insurances.Entities;

namespace Healan.Application.Patients.Dtos;
public class PatientRegisterRequest
{
    public long? PatientId { get; set; }
    public long? UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? Birthdate { get; set; }
    public List<long>? ServiceTypes { get; set; }
    public List<long>? Insurances { get; set; }
}

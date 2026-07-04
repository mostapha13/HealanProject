using Healan.Domain.Doctors.Enums;
using System.ComponentModel.DataAnnotations;
using System.Runtime.InteropServices;

namespace Healan.Application.Doctors.Dtos;
public class DoctorRegisterRequest
{
    public long? DoctorId { get; set; }
    public Guid? IdentityUserId { get; set; }
    public long CompanyId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string? PersonnelNumber { get; set; }
    public string Mobile { get; set; }
    public DateTime? Birthdate { get; set; }
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }
    [Display(Name ="شماره نظام پزشکی")]
    public int MedicalSystemNumber { get; set; }
}


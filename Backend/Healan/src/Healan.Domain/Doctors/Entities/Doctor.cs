using Healan.Domain.Appointments.Entities;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Doctors.Enums;
using Healan.Domain.Users.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Doctors.Entities;
public class Doctor : AuditableEntity
{
    public Doctor()
    {
        Appointments = new Collection<Appointment>();
    }
    public long DoctorId { get; set; }   
    public long UserId { get; set; }
    public long CompanyId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string? PersonnelNumber { get; set; }
    public string Mobile { get; set; }
    public DateTime? Birthdate { get; set; }
    public int MedicalSystemNumber { get; set; }
    public MedicalGroupTypeId MedicalGroupTypeId { get; set; }


    public Company Company { get; set; }

    public ICollection<Appointment> Appointments { get; set; }
    public User User { get; set; }
}

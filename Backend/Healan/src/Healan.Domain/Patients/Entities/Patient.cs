using Healan.Domain.Appointments.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Users.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Patients.Entities;
public class Patient : AuditableEntity
{
    public Patient()
    {      
        Appointments=new Collection<Appointment>();
    }
    public long PatientId { get; set; }
    public long UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string NationalCode { get; set; }
    public string PhoneNumber { get; set; }
    public DateTime? Birthdate { get; set; }

   // public ICollection<Insurance> Insurances { get; set; }

    public ICollection<Appointment> Appointments { get; set; }
    public User User { get; set; }

}


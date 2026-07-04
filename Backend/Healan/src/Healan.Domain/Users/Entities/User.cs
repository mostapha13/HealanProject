
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Users.Enums;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Users.Entities
{
    public class User : AuditableEntity
    {
        public User()
        {
            Doctors=new Collection<Doctor>();
            Patients=new Collection<Patient>();
        }
        public long UserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string? PersonnelNumber { get; set; }
        public string? Landline { get; set; }
        public string? PrefixNumber { get; set; }
        public long? CompanyId { get; set; }
        public string? ExtensionCompanyPhoneNumber { get; set; }
        public Guid? AttachmentId { get; set; }
        public bool IsActive { get; set; }
        public UserTypeId UserTypeId { get; set; }

        public Attachment Attachment { get; set; }
        public Company Company { get; set; }
        public ICollection<Doctor> Doctors { get; set; }
        public ICollection<Patient> Patients { get; set; }
    }
}

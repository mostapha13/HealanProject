using Healan.Domain.Attachments.Entities;
using Healan.Domain.Companies.Enums;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Users.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;


namespace Healan.Domain.Companies.Entities;
public class Company : AuditableEntity
{
    public Company()
    {
        Doctors = new Collection<Doctor>();
        ChildCompanies=new Collection<Company>();
    }
    public long CompanyId { get; set; }
    public long? ParentCompanyRef { get; set; }
    public string CompanyName { get; set; }
    public string LatinCompanyName { get; set; }
    /// <summary>
    /// تاریخ تأسیس
    /// </summary>
    public DateTime? EstablishmentDate { get; set; }
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    public string NationalId { get; set; }
    public string WebSite { get; set; }
    public string Email { get; set; }

    public string RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string Landline { get; set; }
    public string PrefixNumber { get; set; }
    public string Address { get; set; }
    public int? CategoryNumber { get; set; }
    public Guid? AttachmentId { get; set; }
    public Attachment Attachment { get; set; }

    /// <summary>
    /// نوع شرکت
    /// </summary>
    public CompanyRegistrationType CompanyRegistrationType { get; set; }
    public Company ParentCompany { get; set; }
    public virtual ICollection<Company> ChildCompanies { get; set; }
    public ICollection<Doctor> Doctors { get; set; }
    public ICollection<User> Users { get; set; }
}
using Healan.Application.Attachments.Dtos;
using Healan.Domain.Companies.Enums;

namespace Healan.Application.Companies.Dtos;

public class CompanyRegisterRequest
{
    public long? CompanyId { get; set; }
    /// <summary>
    /// نام شرکت
    /// </summary>
    /// 
    public string CompanyName { get; set; }
    /// <summary>
    /// شرکت مادر
    /// </summary>
    public int? ParentCompanyRef { get; set; }
    public string LatinCompanyName { get; set; }
    /// <summary>
    /// تاریخ تأسیس
    /// </summary>
    public DateTime? EstablishmentDate { get; set; }
    public string ActivitySubject { get; set; }

    /// <summary>
    /// نوع شرکت
    /// </summary>
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    /// <summary>
    /// شناسه ملی
    /// </summary>
    public string NationalId { get; set; }
    /// <summary>
    /// وب سایت
    /// </summary>
    public string WebSite { get; set; }
    /// <summary>
    /// آدرس
    /// </summary>
    public string Address { get; set; }
    /// <summary>
    /// تاریخ بهره برداری
    /// </summary>
    public DateTime? OperationDate { get; set; }


    public string RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string Email { get; set; }
    /// <summary>
    /// شماره تلفن دفتر مرکزی
    /// </summary>
    public string Landline { get; set; }
    public string PrefixNumber { get; set; }
    /// <summary>
    /// لوگو
    /// </summary>
    //public Guid? LogoId { get; set; }
    public AttachmentDto? AttachmentLogo { get; set; }
    /// <summary>
    /// شرکت زیرمجموعه
    /// </summary>
    public List<int>? ChildsRefCompanies { get; set; }




}

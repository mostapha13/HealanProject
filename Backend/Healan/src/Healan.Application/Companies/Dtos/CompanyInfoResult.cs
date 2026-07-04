using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Companies.Enums;

namespace Healan.Application.Companies.Dtos;

public record CompanyInfoResult : IMapFrom<Company>
{
    public long? CompanyId { get; set; }
    public string CompanyName { get; set; }
    public CompanyInfo? ParentRefCompany { get; set; }
    public string LatinCompanyName { get; set; }
    public DateTime? EstablishmentDate { get; set; }
    public string ActivitySubject { get; set; }
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    public string CompanyRegistrationTypeName { get; set; }
    public string NationalId { get; set; }
    public string WebSite { get; set; }
    public string Address { get; set; }
    public long LastRegisteredCapital { get; set; }
    public int SharesAvailableNumbers { get; set; }
    public long MarketValueOnTheDayOfSupply { get; set; }
    public DateTime? OperationDate { get; set; }
    public int? FinancialPeriod { get; set; }
    public string AdmissionApplicant { get; set; }
    public string AdmissionApplicantRole { get; set; }
    public string BusinessPlanApprovedByTheBoard { get; set; }
    public string Auditor { get; set; }
    public string RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string Email { get; set; }
    public string Landline { get; set; }
    public string PrefixNumber { get; set; }
    public AttachmentDto? AttachmentLogo { get; set; }
    public List<CompanyInfo>? ChildsRefCompanies { get; set; }
    //public IEnumerable<CompanyType> CompanyTypes { get; set; }



    public void Mapping(Profile profile)
    {
        profile.CreateMap<Company, CompanyInfoResult>()
            .ForMember(a => a.CompanyRegistrationTypeName, b => b.MapFrom(c => c.CompanyRegistrationType.CompanyRegistrationTypeName))
            .ForMember(a => a.AttachmentLogo, b => b.MapFrom(c => c.Attachment))
            .ForMember(a => a.ChildsRefCompanies, b => b.MapFrom(c => c.ChildCompanies))
            .ForMember(a => a.ParentRefCompany, b => b.MapFrom(c => c.ParentCompany)
            //.ForMember(a => a.CompanyUsers, b => b.MapFrom(c => c.CompanyUsers)

            );
    }
}



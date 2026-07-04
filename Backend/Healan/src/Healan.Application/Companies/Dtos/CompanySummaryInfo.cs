using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Companies.Enums;

namespace Healan.Application.Companies.Dtos;
public record CompanySummaryInfo
{

    public long CompanyId { get; set; }
    public string CompanyName { get; set; }

    public long? ParentCompanyRef { get; set; }
    public string LatinCompanyName { get; set; }
    public DateTime? EstablishmentDate { get; set; }
    public string ActivitySubject { get; set; }
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
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

    public List<long> ChildsRefCompanies { get; set; }

    //public IEnumerable<CompanyTypeId> CompanyTypes { get; set; }

    public string CEOName { get; set; }
    public string PhoneNumber { get; set; }
    public string Landline { get; set; }
    public string PrefixNumber { get; set; }
    public string Website { get; set; }
    public string Email { get; set; }

    public Guid? CompanyLogoAttachmentId { get; set; }
    public AttachmentDto? CompanyLogo { get; set; }

}


public record CompanySummaryResult : IMapFrom<Company>
{

    public long CompanyId { get; set; }
    public string CompanyName { get; set; }

    public List<long> ChildsRefCompanies { get; set; }
    public string RegistrationNumber { get; set; }
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    public string? CompanyRegistrationTypeName { get; set; }
    public string NationalId { get; set; }
    public string Website { get; set; }
    public string Address { get; set; }
    //public IEnumerable<CompanyTypeId> CompanyTypes { get; set; }

    public string Email { get; set; }
    public string PrefixNumber { get; set; }
    public string Landline { get; set; }


    //public IEnumerable<CompanyAttachmentDto> CompanyAttachments { get; set; }
    //public IEnumerable<CompanyUserInfoAttachments> CompanyUsers { get; set; }
    //public Guid? logoId { get; set; }
    //public AttachmentDto? CompanyLogo { get; set; } 


    public void Mapping(Profile profile)
    {

        profile.CreateMap<Company, CompanySummaryResult>()
            .ForMember(a => a.CompanyRegistrationTypeId, b => b.MapFrom(c => c.CompanyRegistrationTypeId))
            //.ForMember(a => a.logoId, b => b.MapFrom(c => c.AttachmentId))
            //.ForMember(a => a.CompanyLogo, b => b.MapFrom(c => c.Attachment))
            .ForMember(a => a.ChildsRefCompanies, b => b.MapFrom(c => c.ChildCompanies.Select(x => x.CompanyId)))
            .ForMember(a => a.CompanyRegistrationTypeName, b => b.MapFrom(c => c.CompanyRegistrationType.CompanyRegistrationTypeName));
    }

}
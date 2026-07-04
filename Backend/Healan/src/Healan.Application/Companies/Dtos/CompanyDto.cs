using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Companies.Entities;

namespace Healan.Application.Companies.Dtos;
public record CompanyDto(long Id, string Name, string Address, string PhoneNumber, string Email);

public record CompanyInfo : IMapFrom<Company>
{
    public long? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string? Address { get; set; }
    public string? Landline { get; set; }
    public string? PrefixNumber { get; set; }
    public string? Website { get; set; }
    public string DossierLevelTypeName { get; set; }
    public string DossierLevelTypeColor { get; set; }
    //public List<CompanyUserInfo> CompanyUsers { get; set; }
    public AttachmentDto? Attachment { get; set; }



    public void Mapping(Profile profile)
    {
        profile.CreateMap<Company, CompanyInfo>()
            .ForMember(dest => dest.CompanyId, opt => opt.MapFrom(src => src.CompanyId))
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.CompanyName))
            .ForMember(dest => dest.Attachment, opt => opt.MapFrom(src => src.Attachment))
            //.ForMember(dest => dest.CompanyUsers, opt => opt.MapFrom(src => src.CompanyUsers))

            ;
    }

}

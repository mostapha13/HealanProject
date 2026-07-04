using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Insurances.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Insurances.Dtos;
public record InsuranceInfoResult : IMapFrom<InsuranceCompany>
{
    public long InsuranceCompanyId { get; set; }
    public string Name { get; set; }
    public string? Code { get; set; }
    public string? PhoneNumber { get; set; }
    public InsuranceTypeId InsuranceTypeId { get; set; }
    public string InsuranceTypeName { get; set; }
    public AttachmentDto? Attachment { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InsuranceCompany, InsuranceInfoResult>()
            .ForMember(a => a.InsuranceTypeName,
            b => b.MapFrom(c => c.InsuranceTypeId.GetDisplayName()));
    }
}

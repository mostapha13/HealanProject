using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Insurances.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Insurances.Dtos;
public record InsuranceSummaryResult : IMapFrom<InsuranceCompany>
{
    public long InsuranceCompanyId { get; set; }
    public InsuranceTypeId InsuranceTypeId { get; set; }
    public string InsuranceTypeName { get; set; }
    public string Name { get; set; }
    public string? Code { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public Guid? AttachmentId { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InsuranceCompany, InsuranceSummaryResult>()
            .ForMember(a => a.InsuranceTypeName,
            b => b.MapFrom(c => c.InsuranceTypeId.GetDisplayName()));
    }
}

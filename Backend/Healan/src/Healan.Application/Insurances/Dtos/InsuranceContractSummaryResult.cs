using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;

namespace Healan.Application.Insurances.Dtos;

public record InsuranceContractSummaryResult : IMapFrom<InsuranceContract>
{
    public long InsuranceContractId { get; set; }
    public long InsuranceCompanyId { get; set; }
    public string InsuranceCompanyName { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public AttachmentDto? Attachment { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmailAddress { get; set; }
    public bool IsActive { get; set; }
    public ICollection<InsuranceContractServiceDto> InsuranceContractServiceDto { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InsuranceContract, InsuranceContractSummaryResult>()
             .ForMember(a => a.InsuranceContractServiceDto, b => b.MapFrom(c => c.InsuranceContractServices))
             .ForMember(a => a.Attachment, b => b.MapFrom(c => c.Attachment))

          ;
    }
}

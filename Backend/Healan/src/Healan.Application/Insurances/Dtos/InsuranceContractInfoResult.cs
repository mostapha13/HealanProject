using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;

namespace Healan.Application.Insurances.Dtos;

public record InsuranceContractInfoResult : IMapFrom<InsuranceContract>
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
    public ICollection<InsuranceContractServiceDto> InsuranceContractServices { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InsuranceContract, InsuranceContractInfoResult>()
            .ForMember(a => a.InsuranceCompanyName, b => b.MapFrom(c => c.InsuranceCompany.Name))
            .ForMember(a => a.InsuranceContractServices, b => b.MapFrom(c => c.InsuranceContractServices))
            .ForMember(a => a.Attachment,b => b.MapFrom(c => c.Attachment));
        
    }
}

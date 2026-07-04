using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;

namespace Healan.Application.Insurances.Dtos;

public record InsuranceContractServiceDto : IMapFrom<InsuranceContractService>
{
    public long InsuranceContractServiceId { get; set; }
    public long InsuranceContractId { get; set; }
    public long ServiceTypeId { get; set; }
    /// <summary>
    /// درصد پوشش بیمه
    /// </summary>
    public decimal CoveragePercentage { get; set; }
    public decimal FinalPrice { get; set; }
    /// <summary>
    /// فرانشیز ثابت بیمار
    /// </summary>
    public decimal CoPayment { get; set; }
    /// <summary>
    /// تاریخ شروع اعمال تعرفه
    /// </summary>
    public DateTime EffectiveFrom { get; set; }
    /// <summary>
    /// تاریخ پایان اعمال تعرفه
    /// </summary>
    public DateTime? EffectiveTo { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InsuranceContractService, InsuranceContractServiceDto>();
    }
}

using Healan.Application.Common.Mappings;
using Healan.Domain.Insurances.Entities;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Dtos;
public class RegisterInsuranceContractRequestDto : IMapFrom<InsuranceContract>
{
    public RegisterInsuranceContractRequestDto()
    {
        InsuranceContractServices = new Collection<InsuranceContractServiceRequestDto>();
    }
    public long InsuranceContractId { get; set; }
    public long InsuranceCompanyId { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? AttachmentId { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmailAddress { get; set; }
    public bool IsActive { get; set; }

    public ICollection<InsuranceContractServiceRequestDto> InsuranceContractServices { get; set; }

}

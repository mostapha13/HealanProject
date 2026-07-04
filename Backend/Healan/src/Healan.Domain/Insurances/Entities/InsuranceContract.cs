using Healan.Domain.Attachments.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Insurances.Entities;
/// <summary>
/// قرارداد بیمه
/// </summary>
public class InsuranceContract : AuditableEntity
{
    public InsuranceContract()
    {
        InsuranceContractServices=new Collection<InsuranceContractService>();
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

    public Attachment Attachment { get; set; }
    public InsuranceCompany InsuranceCompany { get; set; }
    public ICollection<InsuranceContractService> InsuranceContractServices { get; set; }
}

using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Entities;

namespace Healan.Domain.MedicalFeeServices.Entities;
public class MedicalFeeService : AuditableEntity
{
    public long MedicalFeeServiceId { get; set; }
    public long ServiceTypeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public long Price { get; set; }
    public ServiceType ServiceType { get; set; }
}

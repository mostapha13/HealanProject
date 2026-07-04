using Share.Domain.Entities;

namespace Healan.Domain.Orders.Entities;
public class PrescriptionDrug: AuditableEntity
{
    public long PrescriptionDrugId { get; set; }
    public long PrescriptionId { get; set; }
    public string DrugName { get; set; }
    public string Dosage { get; set; }
    public string UsageInstructions { get; set; }
 
    public Prescription Prescription { get; set; }
}

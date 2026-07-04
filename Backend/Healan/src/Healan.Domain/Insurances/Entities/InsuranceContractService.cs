using Healan.Domain.Invoices.Entities;
using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Insurances.Entities;

/// <summary>
/// قرارداد بیمه
/// </summary>
public class InsuranceContractService : AuditableEntity
{
    public InsuranceContractService()
    {
        InvoiceItems=new List<InvoiceItem>();
    }
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
    public InsuranceContract InsuranceContract { get; set; }
    public List<InvoiceItem>? InvoiceItems { get; set; }
    public ServiceType ServiceType { get; set; }

}


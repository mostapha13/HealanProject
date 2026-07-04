using Healan.Domain.Insurances.Entities;
using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Entities;

namespace Healan.Domain.Invoices.Entities;

public class InvoiceItem : AuditableEntity
{
    public long InvoiceItemId { get; set; }
    public long InvoiceId { get; set; }
    /// <summary>
    /// نوع خدمات ارائه شده
    /// </summary>
    public long ServiceTypeId { get; set; }
    /// <summary>
    /// قیمت واحد از InsuranceContractService
    /// </summary>
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    /// <summary>
    /// UnitPrice*Quantity
    /// </summary>
    public decimal Amount { get;private set; }
    /// <summary>
    /// تعرفه این خدمت با قرارداد با این بیمه بیمار چقد هست در صورت قرارداد بیمه  داشتن بیمار
    /// </summary>
    public long? InsuranceContractServiceId { get; set; }
    /// <summary>
    /// سهم بیمه پایه برای این آیتم
    /// </summary>
    public decimal PrimaryInsuranceCovered { get; set; }
    /// <summary>
    /// سهم بیمه تکمیلی برای این آیتم
    /// </summary>
    public decimal SecondaryInsuranceCovered { get; set; }

    /// <summary>
    /// سهم بیمار
    /// </summary>
    public decimal PatientPayable { get; set; }
    public Invoice Invoice { get; set; }
    public ServiceType ServiceType { get; set; }
    public InsuranceContractService? InsuranceContractService { get; set; }



}

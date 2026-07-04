using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Invoices.Entities;

namespace Healan.Application.Invoices.Dtos;

public class InvoiceItemDto : IMapFrom<InvoiceItem>
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
    public decimal Amount { get; private set; }
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
    public void Mapping(Profile profile)
    {

        profile.CreateMap<InvoiceItem, InvoiceItemDto>();
    }
}


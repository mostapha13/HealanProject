using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.ServiceTypes.Dtos;
using Healan.Domain.Invoices.Entities;

namespace Healan.Application.Appointments.Dtos;
public class InvoiceItemDto : IMapFrom<InvoiceItem>
{
    public long InvoiceItemId { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Amount { get; private set; }
    public long? InsuranceContractServiceId { get; set; }
    public decimal PrimaryInsuranceCovered { get; set; }
    public decimal SecondaryInsuranceCovered { get; set; }
    public decimal PatientPayable { get; set; }
    public ServiceTypeDto ServiceType { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<InvoiceItem, InvoiceItemDto>()
            .ForMember(a => a.ServiceType, b => b.MapFrom(c => c.ServiceType));
    }
}


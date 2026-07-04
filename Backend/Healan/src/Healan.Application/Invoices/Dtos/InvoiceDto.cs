using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Invoices.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Invoices.Dtos;
public class InvoiceDto : IMapFrom<Invoice>
{
    public long InvoiceId { get; set; }
    public long AppointmentId { get; set; }

    public InvoiceStatusTypeId InvoiceStatusTypeId { get; set; }
    public string InvoiceStatusTypeName { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PrimaryInsuranceCovered { get; set; }
    public decimal SecondaryInsuranceCovered { get; set; }
    public decimal PatientPayable { get; set; }
    public ICollection<InvoiceItemDto> InvoiceItems { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Invoice, InvoiceDto>()
            .ForMember(a => a.InvoiceStatusTypeName, b => b.MapFrom(c => c.InvoiceStatusTypeId.GetDisplayName()));
    }
}


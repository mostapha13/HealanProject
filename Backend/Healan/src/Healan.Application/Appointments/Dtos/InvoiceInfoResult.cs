using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Application.Invoices.Dtos;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Invoices.Enums;
using Share.Domain.Extensions;

namespace Healan.Application.Appointments.Dtos;
public class InvoiceInfoResult : IMapFrom<Invoice>
{
    public long InvoiceId { get; set; }
    public long AppointmentId { get; set; }

    public InvoiceStatusTypeId InvoiceStatusTypeId { get; set; }
    public string InvoiceStatusTypeName { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PrimaryInsuranceCovered { get; set; }
    public decimal SecondaryInsuranceCovered { get; set; }
    public decimal PatientPayable { get; set; }
    public AppointmentInfoResult Appointment { get; set; }
    public List<PaymentDto> Payments { get; set; }

    public void Mapping(Profile profile)
    {

        profile.CreateMap<Invoice, InvoiceInfoResult>()
            .ForMember(a => a.Appointment, b => b.MapFrom(c => c.Appointment))
            .ForMember(a => a.Payments, b => b.MapFrom(c => c.Payments))
            .ForMember(a => a.InvoiceStatusTypeName, b => b.MapFrom(c => c.InvoiceStatusTypeId.GetDisplayName()))
            ;
    }
}


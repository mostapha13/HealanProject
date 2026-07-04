using AutoMapper;
using Healan.Application.Common.Mappings;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Invoices.Enums;
using Share.Domain.Extensions;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Invoices.Dtos;
public class PaymentDto : IMapFrom<Payment>
{
    public long PaymentId { get; set; }
    public long InvoiceId { get; set; }
    [Display(Name = "مبلغ کل خدمات")]
    public decimal TotalAmount { get; set; }

    //سهم پرداخت
    public decimal PatientShare { get; set; }
    public decimal PrimaryInsuranceConvered { get; set; }
    public decimal SecondaryInsuranceCovered { get; set; }

    //بیمه ها
    public long? PrimaryInsuranceId { get; set; }
    public long? SecondaryInsuranceId { get; set; }

    //قرارداد بیمه مورد نظر
    public long? PrimaryInsuranceContractId { get; set; }
    public long? SecondaryInsuranceContractId { get; set; }

    public PaymentStatusTypeId PaymentStatusTypeId { get; set; }
    public string PaymentStatusTypeName { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentReference { get; set; }
    public PaymentMethodTypeId PaymentMethodTypeId { get; set; }
    public string PaymentMethodTypeName { get; set; }

    public string? Description { get; set; }
    public void Mapping(Profile profile)
    {

        profile.CreateMap<Payment, PaymentDto>()
            .ForMember(a => a.PaymentStatusTypeName, b => b.MapFrom(c => c.PaymentStatusTypeId.GetDisplayName()))
            .ForMember(a => a.PaymentMethodTypeName, b => b.MapFrom(c => c.PaymentMethodTypeId.GetDisplayName()))

            ;
    }
}


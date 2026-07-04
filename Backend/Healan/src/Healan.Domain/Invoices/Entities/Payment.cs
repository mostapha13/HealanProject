using Healan.Domain.Invoices.Enums;
using Healan.Domain.Patients.Entities;
using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Invoices.Entities;
public class Payment : AuditableEntity
{
    public long PaymentId { get; set; }
    public long InvoiceId { get; set; }
    [Display(Name ="مبلغ کل خدمات")]
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
    public string? Description { get; set; }
    public PaymentStatusTypeId PaymentStatusTypeId { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentReference { get; set; }
    public PaymentMethodTypeId PaymentMethodTypeId { get; set; }
    public Invoice Invoice { get; set; }



}


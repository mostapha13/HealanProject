using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Invoices.Enums;

public enum PaymentMethodTypeId : byte
{
    [Display(Name ="نقد")]
    Cash=1,
    [Display(Name = "کارت")]
    Card = 2,
    [Display(Name = "آنلاین")]
    Online = 3,
    [Display(Name ="پرداخت توسط بیمه")]
    Insurance= 4
}
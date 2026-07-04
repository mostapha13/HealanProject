using System.ComponentModel.DataAnnotations;

namespace Healan.Domain.Invoices.Enums;

public enum PaymentStatusTypeId : int
{
    [Display(Name ="فاکتور صادر شده ولی هنوز پرداخت نشده است.")]
    Pending=1,
    [Display(Name = "پرداخت با موفقیت انجام شد.")]
    Completed = 2,
    [Display(Name ="تلاش برای پرداخت انجام شده ولی موفق نبوده است.")]
    Failed=3,
    [Display(Name ="پرداخت به دلایلی لغو شده است.")]
    Cancelled =4,
    [Display(Name ="مبلغ پرداختی به بیمار یا بیمه برگشت داده شده است.")]
    Refunded = 5
}

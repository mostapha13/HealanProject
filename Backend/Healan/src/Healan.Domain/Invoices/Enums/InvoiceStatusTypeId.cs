using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Invoices.Enums;
public enum InvoiceStatusTypeId:byte
{
    [Display(Name = "پرداخت نشده")]
    Pending = 1,
    [Display(Name = "پرداخت شده")]
    Paid = 2,
    Paied = Paid,
    [Display(Name = "کنسل شده")]
    Canceled = 3
}

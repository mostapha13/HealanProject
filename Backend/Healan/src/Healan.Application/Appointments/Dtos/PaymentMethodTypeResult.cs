using Healan.Domain.Invoices.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Appointments.Dtos;
    public class PaymentMethodTypeResult
    {
    public PaymentMethodTypeId PaymentMethodTypeId { get; set; }
    public string PaymentMethodTypeName { get; set; }
}

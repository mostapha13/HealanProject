using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Common.Entities;

public class OrderCashInfo : IEntity
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; } 
    public Guid OrderTypeId { get; set; } 
    public OrderType OrderType { get; set; }

}
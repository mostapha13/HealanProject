using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Common.Entities;

public class OrderType : IEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string StartForm { get; set; }
    public string SearchForm { get; set; }
    public ICollection<OrderCashInfo> OrderCashInfos { get; set; }
}
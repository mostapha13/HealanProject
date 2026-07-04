using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Common.Entities;

public class OrderDetail
{
    
    public Guid OrderId { get; set; }
    public Guid FundId { get; set; }
    //public Guid? InstrumentId  { get; set; }
    public Guid? InstrumentParameterId { get; set; }
    public decimal BringCash { get; set; }
    public decimal BringShare { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsDeny { get; set; }
    //public Fund Fund { get; set; }
    //public Instrument Instrument { get; set; }

   
}
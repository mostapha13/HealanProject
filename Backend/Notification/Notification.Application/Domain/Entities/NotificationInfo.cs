using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Application.Domain.Entities
{
    public class NotificationInfo
    {
        public NotificationInfo()
        {
            NotificationUsers = new List<NotificationUser>();
        }
        public Guid NotificationInfoId { get; set; }
        public Guid? InstrumentId { get; set; }
        public Guid? OrderId { get; set; }
        public AccessSystemId AccessSystemId { get; set; }
        public string MessageText { get; set; }
        public DateTime Notif_Date { get; set; }
        public Guid Creator { get; set; }
        public InstrumentInfo Instrument { get; set; }
        public Dictionary<string, string> ExtraInfo { get; set; }
        public ICollection<NotificationUser> NotificationUsers { get; set; }
    }
    public class InstrumentInfo
    {
        public string SymbolCode { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public MarketTypeId? MarketTypeId { get; set; }
        public long? Investment { get; set; }
        public string CompanyName { get; set; }


    }
}

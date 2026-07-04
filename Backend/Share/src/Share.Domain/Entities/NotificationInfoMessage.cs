using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Entities
{
    public class NotificationInfoMessage
    {
        public AccessSystemId AccessSystemId { get; set; }
        public Guid? NotificationInfoId { get; set; }
        public Guid Creator { get; set; }
        public NotificationInfoMessage()
        {
            NotificationUsers=new List<NotificationUserMessage>();
            ExtraInfo = new Dictionary<string, string>();
        }
        public Guid? InstrumentId { get; set; }
        public Guid? OrderId { get; set; }
        public string MessageText { get; set; }
        public InstrumentInfoMessage Instrument { get; set; }
        public Dictionary<string,string> ExtraInfo { get; set; }
        public ICollection<NotificationUserMessage> NotificationUsers { get; set; }
    }
    public class InstrumentInfoMessage
    {
        public string SymbolCode { get; set; }
        public string Symbol { get; set; }
        public string SymbolName { get; set; }
        public MarketTypeId? MarketTypeId { get; set; }
        public long? Investment { get; set; }
        public string CompanyName { get; set; }


    }
}

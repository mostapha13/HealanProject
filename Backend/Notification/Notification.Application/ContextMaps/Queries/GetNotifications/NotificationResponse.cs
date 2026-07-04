using AutoMapper;
using Notification.Application.Domain.Entities;
using Notification.Application.Mappings;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Application.ContextMaps.Queries.GetNotifications
{
    public class NotificationResponse: IMapFrom<NotificationInfo>
    {
        public AccessSystemId AccessSystemId { get; set; }
        public string AccessSystemName { get; set; }
        public Guid NotificationId { get; set; }
        public DateTime? Notif_Date { get; set; }
        public InstrumentInfo Instrument { get; set; }
        public string MessageText { get; set; }
        public View_Type Status { get; set; }
        public Dictionary<string, string> ExtraInfo { get; set; }
        public void Mapping(Profile profile)
        {
            profile.CreateMap<NotificationInfo, NotificationResponse>()

            .ForMember(a => a.Instrument, b => b.MapFrom(c => new InstrumentInfo
            {
                CompanyName=c.Instrument.CompanyName,
                Investment=c.Instrument.Investment,
                MarketTypeId=c.Instrument.MarketTypeId,
                Symbol=c.Instrument.Symbol,
                SymbolCode=c.Instrument.SymbolCode,
                SymbolName=c.Instrument.SymbolName
            }))
            .ForMember(a=>a.NotificationId,b=>b.MapFrom(c=>c.NotificationInfoId));
        }
    }

}

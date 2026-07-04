using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Notification.Application.Domain.Entities
{
    public class NotificationUser
    {
        public Guid NotificationUserId { get; set; }
        public Guid NotificationInfoId { get; set; }
        public Guid UserId { get; set; }
        public DateTime? ReadDateTime { get; set; }
        public NotificationInfo NotificationInfo { get; set; }
    }
}

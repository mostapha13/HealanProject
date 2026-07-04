using Microsoft.EntityFrameworkCore;
using Notification.Application.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Notification.Application.Interface
{
    public interface IApplicationDbContext
    {
        DbSet<NotificationInfo> NotificationInfos { get; set; }
        DbSet<NotificationUser> NotificationUsers { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}

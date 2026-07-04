
using Microsoft.EntityFrameworkCore;
using Notification.Application.Domain.Entities;
using Notification.Application.Interface;
using Share.Application.Common.Interfaces;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace Notification.Infrastructure.Persistence
{
    //ToDo: Find a way to change dt to utc before insert or update
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        private readonly IDateTime _dateTime;
        public ApplicationDbContext(
            DbContextOptions options,
            IDateTime dateTime) : base(options)
        {
            _dateTime = dateTime;
         
        }


        public DbSet<NotificationInfo> NotificationInfos { get; set; }
        public DbSet<NotificationUser> NotificationUsers { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            base.OnModelCreating(builder);
        }

    }
}

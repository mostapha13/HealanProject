using CaptchaProvider.Domain.Entities;
using CaptchaProvider.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace CaptchaProvider.Infrastructure.Persistence
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


        public DbSet<CaptchaInfo> CaptchaInfos { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            base.OnModelCreating(builder);
        }

    }
}

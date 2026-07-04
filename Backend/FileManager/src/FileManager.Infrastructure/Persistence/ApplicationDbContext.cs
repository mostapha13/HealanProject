using FileManager.Domain.Entities;
using FileManager.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Share.Application.Common.Interfaces;
using Share.Domain.Entities;
using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
namespace FileManager.Infrastructure.Persistence
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


        public DbSet<FileManager.Domain.Entities.File> Files { get; set; }

        public DbSet<FileType> FileTypes { get; set; }

        public DbSet<PdfSignature> PdfSignatures { get; set; }


        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<CreatableEntry>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = _dateTime.Now;
                        break;
                }
            }
            foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = _dateTime.Now;
                        break;

                    //case EntityState.Modified:
                    //    if (entry.OriginalValues[nameof(entry.Entity.LastModifiedAt)] != null)
                    //        entry.OriginalValues[nameof(entry.Entity.LastModifiedAt)] = entry.Entity.LastModifiedAt;
                    //    if (entry.OriginalValues[nameof(entry.Entity.LastModifiedBy)] != null)
                    //        entry.OriginalValues[nameof(entry.Entity.LastModifiedBy)] = _currentUserService.UserId;
                    //    entry.Entity.LastModifiedBy = _currentUserService.UserId;
                    //    entry.Entity.LastModifiedAt = _dateTime.Now;
                    //    break;
                }
            }

            var result = await base.SaveChangesAsync(cancellationToken);

            return result;
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            

            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            builder.HasDbFunction(
    this.GetType().GetMethod(nameof(JsonValue))!
).HasName("JSON_VALUE").IsBuiltIn();

            builder.HasDbFunction(
this.GetType().GetMethod(nameof(ISJSON))!
).HasName("ISJSON").IsBuiltIn();
            //builder.HasDbFunction(
            //    this.GetType().GetMethod(nameof(JsonQuery))!
            //).HasName("JSON_QUERY").IsBuiltIn();
            //base.OnModelCreating(builder);
        }


        public static string JsonValue(string column, [NotParameterized] string path)
    => throw new NotSupportedException();


        public static bool ISJSON(string column)
=> throw new NotSupportedException();
        //public static string JsonQuery(string column, [NotParameterized] string path) =>
        //    throw new NotSupportedException();

    }
}

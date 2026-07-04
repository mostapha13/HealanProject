using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Entities;
using System.Reflection;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Infrastructure.Persistence
{
    //ToDo: Find a way to change dt to utc before insert or update
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IDateTime _dateTime;
        //private readonly IDomainEventService _domainEventService;

        public ApplicationDbContext(
            DbContextOptions options,
            ICurrentUserService currentUserService,
            IDateTime dateTime) : base(options)
        {
            _currentUserService = currentUserService;
            _dateTime = dateTime;
        }
        public DbSet<WorkFlowUser> WorkFlowUsers { get; set; }
        public DbSet<WorkFlowUserGroup> WorkFlowUserGroups { get; set; }
        public DbSet<Fund> Funds { get; set; }

        public DbSet<OrderStatus> OrderStatues { get; set; }
        public DbSet<Order> Orders { get; set; }


        public DbSet<Form> Forms { get; set; }
        public DbSet<WorkFlowItem> WorkFlowItems { get; set; }
        public DbSet<WorkFlowArchive> WorkFlowArchives { get; set; }
        public DbSet<WorkFlowGuide> WorkFlowGuides { get; set; }
        public DbSet<WorkFlowType> WorkFlowTypes { get; set; }
        public DbSet<WorkFlowStatusGuide> WorkFlowStatusGuides { get; set; }

        public DbSet<OrderComment> OrderComments { get; set; }
        //public DbSet<UserCardboardRecordView> UserCardboardRecordViews { get; set; }
        //public DbSet<UserCardboardRecordView_history> UserCardboardRecordView_histories { get; set; }


        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<CreatableEntry>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedBy = _currentUserService.UserId;
                        entry.Entity.CreatedAt = _dateTime.Now;
                        entry.Entity.DepartmentId = _currentUserService.DepartmentId;
                        break;
                }
            }
            foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedBy = _currentUserService.UserId;
                        entry.Entity.CreatedAt = _dateTime.Now;
                        break;

                    case EntityState.Modified:
                        if (entry.OriginalValues[nameof(entry.Entity.LastModifiedAt)] != null)
                            entry.OriginalValues[nameof(entry.Entity.LastModifiedAt)] = entry.Entity.LastModifiedAt;
                        if (entry.OriginalValues[nameof(entry.Entity.LastModifiedBy)] != null)
                            entry.OriginalValues[nameof(entry.Entity.LastModifiedBy)] = _currentUserService.UserId;
                        entry.Entity.LastModifiedBy = _currentUserService.UserId;
                        entry.Entity.LastModifiedAt = _dateTime.Now;
                        break;
                }
            }

            var result = await base.SaveChangesAsync(cancellationToken);

            return result;
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            base.OnModelCreating(builder);

            //builder.ToUpperCaseTables();
            //builder.ToUpperCaseColumns();
        }



    }
    public static class DbContextCaseSensitive
    {
        /// <summary>
        /// Set table's name to Uppercase
        /// </summary>
        /// <param name="modelBuilder"></param>
        public static void ToUpperCaseTables(this ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                entityType.SetTableName(entityType.GetTableName().ToUpper());
            }
        }

        /// <summary>
        /// Set column's name to Uppercase 
        /// </summary>
        /// <param name="modelBuilder"></param>
        public static void ToUpperCaseColumns(this ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    property.SetColumnName(property.GetColumnName().ToUpper());
                }
            }
        }

        /// <summary>
        /// Set foreignkey's name to Uppercase
        /// </summary>
        /// <param name="modelBuilder"></param>
        public static void ToUpperCaseForeignKeys(this ModelBuilder modelBuilder)
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    foreach (var fk in entityType.FindForeignKeys(property))
                    {
                        fk.SetConstraintName(fk.GetConstraintName().ToUpper());
                    }
                }
            }
        }

        /// <summary>
        /// Set index's name to Uppercase
        /// </summary>
        /// <param name="modelBuilder"></param>
        //public static void ToUpperCaseIndexes(this ModelBuilder modelBuilder)
        //{
        //    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        //    {
        //        foreach (var index in entityType.GetIndexes())
        //        {
        //            index.SetName(index.GetName().ToUpper());
        //        }
        //    }
        //}
    }
}

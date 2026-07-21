
using IdentityServer.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Reflection;

namespace IdentityServer.Domain.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<ApplicationUser>(entityBuilder =>
            {
                entityBuilder.Property(a => a.FirstName).HasMaxLength(100).IsRequired();
                entityBuilder.Property(a => a.LastName).HasMaxLength(100).IsRequired();
                entityBuilder.Property(a => a.DepartmentId).HasColumnType(nameof(System.Data.SqlDbType.TinyInt)).IsRequired();
                entityBuilder.Property(a => a.IsActive).HasColumnType(nameof(System.Data.SqlDbType.Bit)).HasDefaultValueSql("0").IsRequired();
                entityBuilder.Property(a => a.ResetPasswordToken).HasDefaultValue(null).HasColumnType("nvarchar(max)");
                entityBuilder.Property(a => a.LastLoginIP).HasDefaultValue(null);
                entityBuilder.Property(a => a.LastLoginIP).HasColumnType("varchar(20)");
                entityBuilder.Property(a => a.LastLoginDate).HasColumnType(nameof(System.Data.SqlDbType.DateTime));
                entityBuilder.Property(a => a.CodeSendedDateTime).HasColumnType(nameof(System.Data.SqlDbType.DateTime));
            });

            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            builder.Entity<ApplicationRole>(entityBuilder =>
            {
                entityBuilder.Property(a => a.DisplayName).HasMaxLength(100);
                entityBuilder.Property(a => a.ApplicationRoleGroupId);
                entityBuilder.Property(a => a.CreatedUtc).HasDefaultValueSql("SYSUTCDATETIME()");
                entityBuilder.Property(a => a.IsSystem).HasDefaultValue(false);
                entityBuilder.Property(a => a.IsDeleted).HasDefaultValue(false);
                entityBuilder.HasOne(a => a.ApplicationRoleGroup).WithMany(b => b.ApplicationRoles).HasForeignKey(c => c.ApplicationRoleGroupId).OnDelete(DeleteBehavior.Restrict);
            });

        }

        public DbSet<ActionInfo> ActionInfos { get; set; }
        public DbSet<ApplicationRoleGroup> ApplicationRoleGroups { get; set; }
        public DbSet<ApplicationUserAccess> ApplicationUserAccesses { get; set; }
        public DbSet<SectionInfo> SectionInfos { get; set; }
        public DbSet<SubSystemInfo> SubSystemInfos { get; set; }





        public DbSet<AccessForm> AccessForms { get; set; }
        public DbSet<AccessMenu> AccessMenus { get; set; }
        public DbSet<AccessRole> AccessRoles { get; set; }
        public DbSet<AccessSystem> AccessSystems { get; set; }
        public DbSet<AccessSystemRole> AccessSystemRoles { get; set; }
        public DbSet<AccessUserGrant> AccessUserGrants { get; set; }
        public DbSet<ImpersonationAudit> ImpersonationAudits { get; set; }
    }
}

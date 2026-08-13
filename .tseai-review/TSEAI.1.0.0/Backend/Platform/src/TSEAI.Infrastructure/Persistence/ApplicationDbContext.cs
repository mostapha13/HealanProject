using Microsoft.EntityFrameworkCore;
using TSEAI.Domain.Alerts;
using TSEAI.Domain.Filters;
using TSEAI.Domain.Settings;

namespace TSEAI.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<SavedFilter> SavedFilters => Set<SavedFilter>();
    public DbSet<SavedFilterVersion> SavedFilterVersions => Set<SavedFilterVersion>();
    public DbSet<AlertRule> AlertRules => Set<AlertRule>();
    public DbSet<AlertEvent> AlertEvents => Set<AlertEvent>();
    public DbSet<AlertOutbox> AlertOutbox => Set<AlertOutbox>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<SystemSetting>().HasIndex(x => x.Key).IsUnique();

        b.Entity<SavedFilter>(x =>
        {
            x.Property(p => p.OwnerUserId).HasMaxLength(128).IsRequired();
            x.Property(p => p.Name).HasMaxLength(80).IsRequired();
            x.Property(p => p.NormalizedName).HasMaxLength(80).IsRequired();
            x.Property(p => p.Description).HasMaxLength(500);
            x.Property(p => p.CurrentPersianExplanation).HasMaxLength(4000).IsRequired();
            x.Property(p => p.RowVersion).IsRowVersion().IsConcurrencyToken();
            x.HasIndex(p => new { p.OwnerUserId, p.IsDeleted, p.UpdatedAtUtc });
            x.HasIndex(p => new { p.OwnerUserId, p.IsDeleted, p.IsFavorite });
            x.HasIndex(p => new { p.OwnerUserId, p.NormalizedName }).IsUnique().HasFilter("[IsDeleted] = 0");
            x.HasMany(p => p.Versions).WithOne(v => v.SavedFilter).HasForeignKey(v => v.SavedFilterId).OnDelete(DeleteBehavior.Cascade);
        });


        b.Entity<AlertRule>(x =>
        {
            x.Property(p => p.OwnerUserId).HasMaxLength(128).IsRequired();
            x.Property(p => p.Name).HasMaxLength(100).IsRequired();
            x.Property(p => p.RowVersion).IsRowVersion().IsConcurrencyToken();
            x.HasIndex(p => new { p.OwnerUserId, p.IsDeleted, p.IsEnabled });
            x.HasIndex(p => new { p.SavedFilterId, p.IsDeleted });
            x.HasOne(p => p.SavedFilter).WithMany().HasForeignKey(p => p.SavedFilterId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AlertEvent>(x =>
        {
            x.Property(p => p.OwnerUserId).HasMaxLength(128).IsRequired();
            x.Property(p => p.SymbolCode).HasMaxLength(64);
            x.Property(p => p.Symbol).HasMaxLength(80).IsRequired();
            x.Property(p => p.SymbolName).HasMaxLength(256).IsRequired();
            x.Property(p => p.AlertName).HasMaxLength(100).IsRequired();
            x.Property(p => p.FilterName).HasMaxLength(80).IsRequired();
            x.Property(p => p.PersianExplanation).HasMaxLength(4000).IsRequired();
            x.Property(p => p.Message).HasMaxLength(2000).IsRequired();
            x.HasIndex(p => new { p.OwnerUserId, p.TriggeredAtUtc });
            x.HasIndex(p => new { p.OwnerUserId, p.ReadAtUtc, p.TriggeredAtUtc });
            x.HasIndex(p => new { p.AlertRuleId, p.InsCode, p.TriggeredAtUtc });
            x.HasOne(p => p.AlertRule).WithMany().HasForeignKey(p => p.AlertRuleId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AlertOutbox>(x =>
        {
            x.Property(p => p.EventType).HasMaxLength(100).IsRequired();
            x.Property(p => p.LastError).HasMaxLength(2000);
            x.HasIndex(p => new { p.PublishedAtUtc, p.CreatedAtUtc });
            x.HasIndex(p => p.AlertEventId).IsUnique();
        });

        b.Entity<SavedFilterVersion>(x =>
        {
            x.Property(p => p.PersianExplanation).HasMaxLength(4000).IsRequired();
            x.Property(p => p.SourceConversationId).HasMaxLength(100);
            x.Property(p => p.ChangeType).HasMaxLength(32).IsRequired();
            x.Property(p => p.ChangeNote).HasMaxLength(500);
            x.Property(p => p.CreatedByUserId).HasMaxLength(128).IsRequired();
            x.HasIndex(p => new { p.SavedFilterId, p.Version }).IsUnique();
            x.HasIndex(p => new { p.SavedFilterId, p.CreatedAtUtc });
        });
    }
}

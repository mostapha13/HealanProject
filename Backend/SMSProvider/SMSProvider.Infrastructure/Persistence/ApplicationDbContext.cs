using Microsoft.EntityFrameworkCore;
using SMSProvider.Application.Entities;

namespace SMSProvider.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<SmsOutboxLog> SmsOutboxLogs => Set<SmsOutboxLog>();
    public DbSet<SmsProviderSetting> SmsProviderSettings => Set<SmsProviderSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var e = modelBuilder.Entity<SmsOutboxLog>();
        e.ToTable("SmsOutboxLogs");
        e.HasKey(x => x.Id);
        e.Property(x => x.Id).ValueGeneratedOnAdd();
        e.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        e.Property(x => x.Message).HasMaxLength(2000).IsRequired();
        e.Property(x => x.ExtractedCode).HasMaxLength(32);
        e.Property(x => x.ErrorMessage).HasMaxLength(1000);
        e.Property(x => x.TraceNumber).HasMaxLength(100);
        e.Property(x => x.Channel).HasMaxLength(40);
        e.HasIndex(x => x.CreatedAt);
        e.HasIndex(x => x.PhoneNumber);

        var s = modelBuilder.Entity<SmsProviderSetting>();
        s.ToTable("SmsProviderSettings");
        s.HasKey(x => x.Id);
        s.Property(x => x.Id).ValueGeneratedNever();
        s.Property(x => x.ApiKey).HasMaxLength(200).IsRequired();
        s.Property(x => x.VerifyParameterName).HasMaxLength(50).IsRequired();
        s.Property(x => x.TemplateId).HasDefaultValue(640023);
        s.Property(x => x.LineNumber).HasDefaultValue(0L);
        s.Property(x => x.SendEnabled).HasDefaultValue(true);

        base.OnModelCreating(modelBuilder);
    }
}

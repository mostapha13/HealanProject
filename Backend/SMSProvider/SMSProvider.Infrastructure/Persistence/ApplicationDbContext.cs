using Microsoft.EntityFrameworkCore;
using SMSProvider.Application.Entities;

namespace SMSProvider.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<SmsOutboxLog> SmsOutboxLogs => Set<SmsOutboxLog>();

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
        base.OnModelCreating(modelBuilder);
    }
}

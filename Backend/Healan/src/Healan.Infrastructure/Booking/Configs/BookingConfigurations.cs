using Healan.Domain.Booking.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Healan.Infrastructure.Booking.Configs;

public class DoctorScheduleTemplateConfiguration : IEntityTypeConfiguration<DoctorScheduleTemplate>
{
    public void Configure(EntityTypeBuilder<DoctorScheduleTemplate> builder)
    {
        builder.ToTable("DoctorScheduleTemplates");
        builder.HasKey(x => x.DoctorScheduleTemplateId);
        builder.Property(x => x.DoctorScheduleTemplateId).ValueGeneratedOnAdd();
        builder.Property(x => x.VisitDurationMinutes).HasDefaultValue(30);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.HasIndex(x => new { x.DoctorId, x.DayOfWeek }).IsUnique();
        builder.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class DoctorScheduleExceptionConfiguration : IEntityTypeConfiguration<DoctorScheduleException>
{
    public void Configure(EntityTypeBuilder<DoctorScheduleException> builder)
    {
        builder.ToTable("DoctorScheduleExceptions");
        builder.HasKey(x => x.DoctorScheduleExceptionId);
        builder.Property(x => x.DoctorScheduleExceptionId).ValueGeneratedOnAdd();
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.HasIndex(x => new { x.DoctorId, x.Date }).IsUnique();
        builder.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AppointmentSlotConfiguration : IEntityTypeConfiguration<AppointmentSlot>
{
    public void Configure(EntityTypeBuilder<AppointmentSlot> builder)
    {
        builder.ToTable("AppointmentSlots");
        builder.HasKey(x => x.AppointmentSlotId);
        builder.Property(x => x.AppointmentSlotId).ValueGeneratedOnAdd();
        builder.Property(x => x.Note).HasMaxLength(500);
        builder.HasIndex(x => new { x.DoctorId, x.StartAt }).IsUnique();
        builder.HasIndex(x => new { x.DoctorId, x.StartAt, x.Status });
        builder.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AppointmentBookingConfiguration : IEntityTypeConfiguration<AppointmentBooking>
{
    public void Configure(EntityTypeBuilder<AppointmentBooking> builder)
    {
        builder.ToTable("AppointmentBookings");
        builder.HasKey(x => x.AppointmentBookingId);
        builder.Property(x => x.AppointmentBookingId).ValueGeneratedOnAdd();
        builder.Property(x => x.NationalCode).HasMaxLength(10).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(11).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.HasIndex(x => x.AppointmentSlotId).IsUnique();
        builder.HasIndex(x => new { x.NationalCode, x.CreatedAt });
        builder.HasIndex(x => new { x.PhoneNumber, x.CreatedAt });
        builder.HasIndex(x => new { x.Status, x.CreatedAt });

        builder.HasOne(x => x.Slot)
            .WithOne(s => s.Booking)
            .HasForeignKey<AppointmentBooking>(x => x.AppointmentSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Doctor).WithMany().HasForeignKey(x => x.DoctorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Patient).WithMany().HasForeignKey(x => x.PatientId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Appointment).WithMany().HasForeignKey(x => x.AppointmentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.RequestedServices)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "AppointmentBookingServiceTypes",
                right => right.HasOne<Healan.Domain.PublicInfos.Entities.ServiceType>()
                    .WithMany()
                    .HasForeignKey("ServiceTypeId")
                    .OnDelete(DeleteBehavior.Cascade),
                left => left.HasOne<AppointmentBooking>()
                    .WithMany()
                    .HasForeignKey("AppointmentBookingId")
                    .OnDelete(DeleteBehavior.Cascade),
                join =>
                {
                    join.HasKey("AppointmentBookingId", "ServiceTypeId");
                    join.ToTable("AppointmentBookingServiceTypes");
                });
    }
}

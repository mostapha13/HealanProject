using Healan.Application.Common.Interfaces;
using Healan.Domain.Appointments.Entities;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Companies.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.MedicalFeeServices.Entities;
using Healan.Domain.Menus.Entities;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Portal.Entities;
using Healan.Domain.PublicInfos.Entities;
using Healan.Domain.Users.Entities;
using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage;
using Share.Application.Common.Interfaces;
using Share.Domain.Entities;
using Share.Infrastructure.Extensions;
using System.Reflection;

namespace Healan.Infrastructure.Context;
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private IDbContextTransaction _currentTransaction;
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }

    public DbSet<Menu> Menus { get; set; }
    public DbSet<Submenu> Submenus { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<CompanyRegistrationType> CompanyRegistrationTypes { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserType> UserTypes { get; set; }
    public DbSet<InsuranceType> InsuranceTypes { get; set; }
    public DbSet<InsuranceCompany> InsuranceCompanies { get; set; }
    public DbSet<InsuranceContract> InsuranceContracts { get; set; }
    public DbSet<InsuranceContractService> InsuranceContractServices { get; set; }
    public DbSet<CategoryType> CategoryTypes { get; set; }
    public DbSet<ServiceType> ServiceTypes { get; set; }
    public DbSet<MedicalFeeService> MedicalFeeServices { get; set; }
    public DbSet<Doctor> Doctors { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<PrescriptionDrug> PrescriptionDrugs { get; set; }
    public DbSet<LabTestRequest> LabTestRequests { get; set; }
    public DbSet<LabTestResult> LabTestResults { get; set; }
    public DbSet<ImagingRequest> ImagingRequests { get; set; }
    public DbSet<ImagingResult> ImagingResults { get; set; }
    public DbSet<EchoReport> EchoReports { get; set; }
    public DbSet<PortalContentItem> PortalContentItems { get; set; }
    public DbSet<PortalSiteSetting> PortalSiteSettings { get; set; }
    public DbSet<PatientReview> PatientReviews { get; set; }
    //public DbSet<UserCardboardRecordView> UserCardboardRecordViews { get; set; }
    //public DbSet<UserCardboardRecordView_history> UserCardboardRecordView_histories { get; set; }


    #region SaveChanges
    public override int SaveChanges()
    {
        BeforeSave();
        return base.SaveChanges();
    }
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        BeforeSave();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }
    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        BeforeSave();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        BeforeSave();
        return base.SaveChangesAsync(cancellationToken);
    }
    #endregion


    #region Transaction

    public async Task BeginTransactionAsync()
    {
        if (_currentTransaction != null) return;

        _currentTransaction = await Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        try
        {
            await SaveChangesAsync();
            _currentTransaction?.Commit();
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync()
    {
        try
        {
            await _currentTransaction?.RollbackAsync();
        }
        finally
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.DisposeAsync();
                _currentTransaction = null;
            }
        }
    }

    #endregion

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.SetQueryFilter();
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(builder);
    }
    public virtual void BeforeSave()
    {
        SetChangeTracker();
    }
    private void SetChangeTracker()
    {
        var entries = ChangeTracker
          .Entries()
          .Where(e => e.Entity is AuditableEntity &&
                     (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted));

        var currentUserId = _currentUserService.UserId;

        foreach (var entry in entries)
        {
            var auditable = (AuditableEntity)entry.Entity;
            var now = DateTime.UtcNow;

            switch (entry.State)
            {
                case EntityState.Added:
                    auditable.CreatedAt = now;
                    auditable.CreatedBy = currentUserId;
                    break;

                case EntityState.Modified:
                    if (auditable.IsDeleted)
                    {
                        auditable.DeletedAt = now;
                        auditable.DeletedBy = currentUserId;
                    }
                    else
                    {
                        auditable.LastModifiedAt = now;
                        auditable.LastModifiedBy = currentUserId;
                    }
                    break;
            }
        }
    }
}
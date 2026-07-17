using Healan.Domain.Appointments.Entities;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Booking.Entities;
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
using Healan.Domain.Sms.Entities;
using Healan.Domain.Users.Entities;
using Healan.Domain.Views;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Common.Interfaces;
public interface IApplicationDbContext : IDisposable
{

     DbSet<Menu> Menus { get; set; }
     DbSet<Submenu> Submenus { get; set; }
     DbSet<Attachment> Attachments { get; set; }
     DbSet<Company> Companies { get; set; }
     DbSet<CompanyRegistrationType> CompanyRegistrationTypes { get; set; }
     DbSet<User> Users { get; set; }
     DbSet<UserType> UserTypes { get; set; }
     DbSet<InsuranceType> InsuranceTypes { get; set; }
     DbSet<InsuranceCompany> InsuranceCompanies { get; set; }
     DbSet<InsuranceContract> InsuranceContracts { get; set; }
     DbSet<InsuranceContractService> InsuranceContractServices { get; set; }
     DbSet<CategoryType> CategoryTypes { get; set; }
     DbSet<ServiceType> ServiceTypes { get; set; }
     DbSet<MedicalFeeService> MedicalFeeServices { get; set; }
     DbSet<Doctor> Doctors { get; set; }
     DbSet<Patient> Patients { get; set; }
     DbSet<Appointment> Appointments { get; set; }
     DbSet<Invoice> Invoices { get; set; }
     DbSet<InvoiceItem> InvoiceItems { get; set; }
     DbSet<Payment> Payments { get; set; }
     DbSet<Prescription> Prescriptions { get; set; }
     DbSet<PrescriptionDrug> PrescriptionDrugs { get; set; }
     DbSet<LabTestRequest> LabTestRequests { get; set; }
     DbSet<LabTestResult> LabTestResults { get; set; }
     DbSet<ImagingRequest> ImagingRequests { get; set; }
     DbSet<ImagingResult> ImagingResults { get; set; }
     DbSet<EchoReport> EchoReports { get; set; }
     DbSet<PortalContentItem> PortalContentItems { get; set; }
     DbSet<PortalSiteSetting> PortalSiteSettings { get; set; }
     DbSet<PatientReview> PatientReviews { get; set; }
     DbSet<BlogPost> BlogPosts { get; set; }
     DbSet<RagKnowledgeItem> RagKnowledgeItems { get; set; }
     DbSet<RagSetting> RagSettings { get; set; }
     DbSet<RagChatLog> RagChatLogs { get; set; }
     DbSet<SmsSetting> SmsSettings { get; set; }
     DbSet<DoctorScheduleTemplate> DoctorScheduleTemplates { get; set; }
     DbSet<DoctorScheduleException> DoctorScheduleExceptions { get; set; }
     DbSet<AppointmentSlot> AppointmentSlots { get; set; }
     DbSet<AppointmentBooking> AppointmentBookings { get; set; }
    //DbSet<UserCardboardRecordView> UserCardboardRecordViews { get; set; }
    //DbSet<UserCardboardRecordView_history> UserCardboardRecordView_histories { get; set; }

    #region Transaction
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();

    #endregion



    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    DbSet<TEntity> Set<TEntity>() where TEntity : class;
}


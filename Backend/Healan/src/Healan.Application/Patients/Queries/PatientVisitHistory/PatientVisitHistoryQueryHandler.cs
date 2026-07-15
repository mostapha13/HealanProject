using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;

namespace Healan.Application.Patients.Queries.PatientVisitHistory;

public class PatientVisitHistoryQueryHandler : IRequestHandler<PatientVisitHistoryQuery, List<PatientVisitHistoryItemResult>>
{
    private readonly IApplicationDbContext _db;
    private readonly IClinicAccessScopeService _clinicAccess;

    public PatientVisitHistoryQueryHandler(IApplicationDbContext db, IClinicAccessScopeService clinicAccess)
    {
        _db = db;
        _clinicAccess = clinicAccess;
    }

    public async Task<List<PatientVisitHistoryItemResult>> Handle(
        PatientVisitHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var patientVisible = await _db.Patients
            .ApplyClinicScope(scope)
            .AnyAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (!patientVisible)
            throw new NotFoundExceptions("بیمار یافت نشد یا به این بیمار دسترسی ندارید");

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Include(a => a.Doctor)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.PrescriptionDrugs)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.LabTestRequests)
                    .ThenInclude(l => l.Attachment)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.ImagingRequests)
                    .ThenInclude(i => i.Attachment)
            .Include(a => a.Prescriptions)
                .ThenInclude(p => p.EchoReport)
            .Where(a => a.PatientId == request.PatientId)
            .ApplyClinicScope(scope)
            .OrderByDescending(a => a.AppointmentDate)
            .ToListAsync(cancellationToken);

        var result = new List<PatientVisitHistoryItemResult>();

        foreach (var appointment in appointments)
        {
            var prescription = appointment.Prescriptions?
                .OrderByDescending(p => p.IssueDate)
                .FirstOrDefault();

            var item = new PatientVisitHistoryItemResult
            {
                AppointmentId = appointment.AppointmentId,
                AppointmentDate = appointment.AppointmentDate,
                AppointmentStatus = appointment.AppointmentTypeId.GetDisplayName() ?? appointment.AppointmentTypeId.ToString(),
                DoctorName = appointment.Doctor == null
                    ? null
                    : $"{appointment.Doctor.FirstName} {appointment.Doctor.LastName}".Trim(),
                PrescriptionId = prescription?.PrescriptionId,
                PrescriptionIssueDate = prescription?.IssueDate,
                PrescriptionNotes = prescription?.Notes,
                HasEchoReport = prescription?.EchoReport != null,
            };

            if (prescription != null)
            {
                item.Drugs = prescription.PrescriptionDrugs
                    .Select(d => new PrescriptionDrugDto
                    {
                        DrugName = d.DrugName,
                        Dosage = d.Dosage,
                        UsageInstructions = d.UsageInstructions,
                    })
                    .ToList();

                item.Labs = prescription.LabTestRequests
                    .Select(l => new VisitLabItemResult
                    {
                        LabTestType = l.LabTestType,
                        Notes = l.Notes,
                        AttachmentId = l.AttachmentId,
                        AttachmentLink = l.Attachment?.Link,
                        AttachmentFileName = l.Attachment?.FileName,
                    })
                    .ToList();

                item.Imaging = prescription.ImagingRequests
                    .Select(i => new VisitImagingItemResult
                    {
                        ImageTypeId = (byte)i.ImageTypeId,
                        ImageTypeName = i.ImageTypeId.GetDisplayName() ?? i.ImageTypeId.ToString(),
                        Notes = i.Notes,
                        AttachmentId = i.AttachmentId,
                        AttachmentLink = i.Attachment?.Link,
                        AttachmentFileName = i.Attachment?.FileName,
                    })
                    .ToList();
            }

            result.Add(item);
        }

        return result;
    }
}

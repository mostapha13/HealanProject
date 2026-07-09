using Healan.Application.Orders.Dtos;
using MediatR;

namespace Healan.Application.Patients.Queries.PatientVisitHistory;

public class PatientVisitHistoryQuery : IRequest<List<PatientVisitHistoryItemResult>>
{
    public long PatientId { get; set; }
}

public class PatientVisitHistoryItemResult
{
    public long AppointmentId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string AppointmentStatus { get; set; } = string.Empty;
    public string? DoctorName { get; set; }
    public long? PrescriptionId { get; set; }
    public DateTime? PrescriptionIssueDate { get; set; }
    public string? PrescriptionNotes { get; set; }
    public bool HasEchoReport { get; set; }
    public List<PrescriptionDrugDto> Drugs { get; set; } = new();
    public List<VisitLabItemResult> Labs { get; set; } = new();
    public List<VisitImagingItemResult> Imaging { get; set; } = new();
}

public class VisitLabItemResult
{
    public string LabTestType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public string? AttachmentLink { get; set; }
    public string? AttachmentFileName { get; set; }
}

public class VisitImagingItemResult
{
    public byte ImageTypeId { get; set; }
    public string ImageTypeName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public string? AttachmentLink { get; set; }
    public string? AttachmentFileName { get; set; }
}

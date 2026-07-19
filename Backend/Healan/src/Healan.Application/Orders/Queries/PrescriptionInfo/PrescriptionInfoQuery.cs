using AutoMapper;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Orders.Queries.PrescriptionInfo;

public class PrescriptionInfoQuery : IRequest<PrescriptionInfoResult>
{
    public long PrescriptionId { get; set; }
}

public class PrescriptionInfoQueryHandler : IRequestHandler<PrescriptionInfoQuery, PrescriptionInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public PrescriptionInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }

    public async Task<PrescriptionInfoResult> Handle(PrescriptionInfoQuery request, CancellationToken cancellationToken)
    {
        // Manual map (not ProjectTo): ProjectTo ignores Includes and can drop Attachment /
        // AttachmentId for lab/imaging rows used by the clinic edit form.
        var prescription = await _applicationDbContext.Prescriptions
            .AsNoTracking()
            .Include(x => x.PrescriptionDrugs)
            .Include(x => x.ImagingRequests).ThenInclude(x => x.Attachment)
            .Include(x => x.LabTestRequests).ThenInclude(x => x.Attachment)
            .Include(x => x.EchoReport)
            .FirstOrDefaultAsync(x => x.PrescriptionId == request.PrescriptionId, cancellationToken);

        if (prescription == null)
            return null!;

        return new PrescriptionInfoResult
        {
            PrescriptionId = prescription.PrescriptionId,
            AppointmentId = prescription.AppointmentId,
            IssueDate = prescription.IssueDate,
            Notes = prescription.Notes,
            NextAppointmentDate = prescription.NextAppointmentDate,
            PrescriptionDrugs = _mapper.Map<List<PrescriptionDrugDto>>(prescription.PrescriptionDrugs),
            EchoReport = prescription.EchoReport == null
                ? null
                : _mapper.Map<EchoReportDto>(prescription.EchoReport),
            LabTestRequests = prescription.LabTestRequests
                .Select(l => new LabTestRequestDto
                {
                    LabTestRequestId = l.LabTestRequestId,
                    PrescriptionId = l.PrescriptionId,
                    LabTestType = l.LabTestType,
                    Notes = l.Notes,
                    AttachmentId = l.AttachmentId,
                    Attachment = MapAttachment(l.AttachmentId, l.Attachment),
                })
                .ToList(),
            ImagingRequests = prescription.ImagingRequests
                .Select(i => new ImagingRequestDto
                {
                    ImagingRequestId = i.ImagingRequestId,
                    PrescriptionId = i.PrescriptionId,
                    ImageTypeId = i.ImageTypeId,
                    Notes = i.Notes,
                    AttachmentId = i.AttachmentId,
                    Attachment = MapAttachment(i.AttachmentId, i.Attachment),
                })
                .ToList(),
        };
    }

    private static AttachmentDto? MapAttachment(Guid? attachmentId, Domain.Attachments.Entities.Attachment? attachment)
    {
        if (attachment != null)
        {
            return new AttachmentDto
            {
                FileId = attachment.FileId,
                FileName = attachment.FileName,
                Link = attachment.Link,
                FileType = attachment.FileType,
            };
        }

        // Attachment row missing (orphan FK / EnsureAttachment failed previously) — still return
        // enough for the clinic UI to show a download link from FileManager.
        if (attachmentId.HasValue && attachmentId.Value != Guid.Empty)
        {
            return new AttachmentDto
            {
                FileId = attachmentId.Value,
                FileName = "پیوست",
                Link = $"/File/Download/{attachmentId.Value}",
                FileType = "File",
            };
        }

        return null;
    }
}

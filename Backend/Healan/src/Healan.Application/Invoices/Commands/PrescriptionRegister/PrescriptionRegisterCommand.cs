using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Orders.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;

namespace Healan.Application.Invoices.Commands.PrescriptionRegister;

public class PrescriptionRegisterCommand : PrescriptionRegisterRequest, IRequest<PrescriptionRegisterResult>
{
}

public class PrescriptionRegisterCommandHandler : IRequestHandler<PrescriptionRegisterCommand, PrescriptionRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IFileManagerTool _fileManagerTool;
    private readonly ILogger<PrescriptionRegisterCommandHandler> _logger;

    public PrescriptionRegisterCommandHandler(
        IApplicationDbContext applicationDbContext,
        IFileManagerTool fileManagerTool,
        ILogger<PrescriptionRegisterCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _fileManagerTool = fileManagerTool;
        _logger = logger;
    }

    public async Task<PrescriptionRegisterResult> Handle(PrescriptionRegisterCommand request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        request.PrescriptionDrugs ??= new List<PrescriptionDrugDto>();
        request.ImagingRequests ??= new List<ImagingRequestDto>();
        request.LabTestRequests ??= new List<LabTestRequestDto>();

        await _applicationDbContext.BeginTransactionAsync();

        var prescription = await _applicationDbContext.Prescriptions
            .Include(x => x.PrescriptionDrugs)
            .Include(x => x.ImagingRequests)
            .Include(x => x.LabTestRequests)
            .FirstOrDefaultAsync(x => x.PrescriptionId == request.PrescriptionId, cancellationToken);

        var isNew = prescription == null;
        if (isNew)
        {
            prescription = new Prescription();
            _applicationDbContext.Prescriptions.Add(prescription);
        }
        else
        {
            _applicationDbContext.PrescriptionDrugs.RemoveRange(prescription!.PrescriptionDrugs);
            _applicationDbContext.ImagingRequests.RemoveRange(prescription.ImagingRequests);
            _applicationDbContext.LabTestRequests.RemoveRange(prescription.LabTestRequests);
            prescription.PrescriptionDrugs.Clear();
            prescription.ImagingRequests.Clear();
            prescription.LabTestRequests.Clear();
        }

        prescription!.AppointmentId = request.AppointmentId;
        prescription.IssueDate = request.IssueDate;
        prescription.Notes = request.Notes ?? string.Empty;
        prescription.NextAppointmentDate = request.NextAppointmentDate;

        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        foreach (var drug in request.PrescriptionDrugs)
        {
            prescription.PrescriptionDrugs.Add(new PrescriptionDrug
            {
                DrugName = drug.DrugName,
                Dosage = drug.Dosage ?? string.Empty,
                UsageInstructions = drug.UsageInstructions ?? string.Empty,
            });
        }

        foreach (var imaging in request.ImagingRequests)
        {
            if (imaging.AttachmentId.HasValue)
                await EnsureAttachmentAsync(imaging.AttachmentId.Value, imaging.ImageTypeId.GetDisplayName(), cancellationToken);

            prescription.ImagingRequests.Add(new ImagingRequest
            {
                ImageTypeId = imaging.ImageTypeId,
                Notes = imaging.Notes ?? string.Empty,
                AttachmentId = imaging.AttachmentId,
            });
        }

        foreach (var lab in request.LabTestRequests)
        {
            if (lab.AttachmentId.HasValue)
                await EnsureAttachmentAsync(lab.AttachmentId.Value, lab.LabTestType, cancellationToken);

            prescription.LabTestRequests.Add(new LabTestRequest
            {
                LabTestType = lab.LabTestType,
                Notes = lab.Notes ?? string.Empty,
                AttachmentId = lab.AttachmentId,
            });
        }

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            await _applicationDbContext.CommitTransactionAsync();
            return new PrescriptionRegisterResult(prescription.PrescriptionId);
        }
        catch (Exception ex)
        {
            await _applicationDbContext.RollbackTransactionAsync();
            _logger.LogError(ex, "PrescriptionRegister failed");
            throw new BadRequestExceptions("خطا در ثبت نسخه");
        }
    }

    private async Task EnsureAttachmentAsync(Guid fileId, string title, CancellationToken cancellationToken)
    {
        var exists = await _applicationDbContext.Attachments.AnyAsync(a => a.FileId == fileId, cancellationToken);
        if (exists) return;

        var fileInfo = await _fileManagerTool.GetFileReplyInfo(fileId);
        _applicationDbContext.Attachments.Add(new Attachment
        {
            Link = fileInfo.Link,
            FileId = fileId,
            FileName = fileInfo.FileName,
            FileType = fileInfo.FileType,
            Title = title
        });
    }
}

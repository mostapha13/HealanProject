using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Orders.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
            .Include(x => x.EchoReport)
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

        var hasEchoImaging = request.ImagingRequests.Any(x => x.ImageTypeId == ImageTypeId.Echocardiography)
                             || HasAnyEchoValue(request.EchoReport);

        if (hasEchoImaging && request.EchoReport != null)
        {
            MapEchoReport(prescription, request.EchoReport);
        }
        else if (prescription.EchoReport != null && !hasEchoImaging)
        {
            _applicationDbContext.EchoReports.Remove(prescription.EchoReport);
            prescription.EchoReport = null;
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

    private static bool HasAnyEchoValue(EchoReportDto? dto)
    {
        if (dto == null) return false;
        return typeof(EchoReportDto).GetProperties()
            .Where(p => p.PropertyType == typeof(string))
            .Select(p => p.GetValue(dto) as string)
            .Any(v => !string.IsNullOrWhiteSpace(v));
    }

    private void MapEchoReport(Prescription prescription, EchoReportDto dto)
    {
        if (prescription.EchoReport == null)
        {
            prescription.EchoReport = new EchoReport { PrescriptionId = prescription.PrescriptionId };
            _applicationDbContext.EchoReports.Add(prescription.EchoReport);
        }

        var echo = prescription.EchoReport;
        echo.Phm = NullIfEmpty(dto.Phm);
        echo.Rvid = NullIfEmpty(dto.Rvid);
        echo.Lvidd = NullIfEmpty(dto.Lvidd);
        echo.Lvids = NullIfEmpty(dto.Lvids);
        echo.Ivsd = NullIfEmpty(dto.Ivsd);
        echo.Pwd = NullIfEmpty(dto.Pwd);
        echo.Lvef = NullIfEmpty(dto.Lvef);
        echo.SimpsonEf = NullIfEmpty(dto.SimpsonEf);
        echo.LvMass = NullIfEmpty(dto.LvMass);
        echo.Sm = NullIfEmpty(dto.Sm);
        echo.TelIndex = NullIfEmpty(dto.TelIndex);
        echo.AvAnnulus = NullIfEmpty(dto.AvAnnulus);
        echo.SinusValsalva = NullIfEmpty(dto.SinusValsalva);
        echo.StJunction = NullIfEmpty(dto.StJunction);
        echo.Acs = NullIfEmpty(dto.Acs);
        echo.AscAo = NullIfEmpty(dto.AscAo);
        echo.LaArea = NullIfEmpty(dto.LaArea);
        echo.LaDia = NullIfEmpty(dto.LaDia);
        echo.LaVolume = NullIfEmpty(dto.LaVolume);
        echo.Edv = NullIfEmpty(dto.Edv);
        echo.Esv = NullIfEmpty(dto.Esv);
        echo.Mve = NullIfEmpty(dto.Mve);
        echo.Mva = NullIfEmpty(dto.Mva);
        echo.Mvdt = NullIfEmpty(dto.Mvdt);
        echo.Mvpht = NullIfEmpty(dto.Mvpht);
        echo.MvMean = NullIfEmpty(dto.MvMean);
        echo.MvArea = NullIfEmpty(dto.MvArea);
        echo.MvAnnulus = NullIfEmpty(dto.MvAnnulus);
        echo.PvsMax = NullIfEmpty(dto.PvsMax);
        echo.PvdMax = NullIfEmpty(dto.PvdMax);
        echo.DtiEm = NullIfEmpty(dto.DtiEm);
        echo.DtiAm = NullIfEmpty(dto.DtiAm);
        echo.AovMax = NullIfEmpty(dto.AovMax);
        echo.LvotVmax = NullIfEmpty(dto.LvotVmax);
        echo.LvotVti = NullIfEmpty(dto.LvotVti);
        echo.AvVti = NullIfEmpty(dto.AvVti);
        echo.AoPeak = NullIfEmpty(dto.AoPeak);
        echo.AoMean = NullIfEmpty(dto.AoMean);
        echo.Ava = NullIfEmpty(dto.Ava);
        echo.At = NullIfEmpty(dto.At);
        echo.AovMg = NullIfEmpty(dto.AovMg);
        echo.AovPg = NullIfEmpty(dto.AovPg);
        echo.TrgMax = NullIfEmpty(dto.TrgMax);
        echo.Rvsp = NullIfEmpty(dto.Rvsp);
        echo.Pap = NullIfEmpty(dto.Pap);
        echo.TvMean = NullIfEmpty(dto.TvMean);
        echo.TvAnnulus = NullIfEmpty(dto.TvAnnulus);
        echo.TvMg = NullIfEmpty(dto.TvMg);
        echo.TvPg = NullIfEmpty(dto.TvPg);
        echo.PvMax = NullIfEmpty(dto.PvMax);
        echo.PvPg = NullIfEmpty(dto.PvPg);
        echo.PvVti = NullIfEmpty(dto.PvVti);
        echo.RvotVti = NullIfEmpty(dto.RvotVti);
        echo.Piphi = NullIfEmpty(dto.Piphi);
        echo.Ivc = NullIfEmpty(dto.Ivc);
        echo.RaArea = NullIfEmpty(dto.RaArea);
        echo.SeptalE = NullIfEmpty(dto.SeptalE);
        echo.LateralE = NullIfEmpty(dto.LateralE);
        echo.SPrime = NullIfEmpty(dto.SPrime);
        echo.APrime = NullIfEmpty(dto.APrime);
        echo.SmTdi = NullIfEmpty(dto.SmTdi);
        echo.Tapsie = NullIfEmpty(dto.Tapsie);
        echo.Conclusion = NullIfEmpty(dto.Conclusion);
        echo.Recommendation = NullIfEmpty(dto.Recommendation);
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

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

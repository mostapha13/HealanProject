using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Orders.Queries.EchoReportPrintData;

public class EchoReportPrintDataQuery : IRequest<EchoReportPrintDataResult>
{
    public long PrescriptionId { get; set; }
}

public class EchoReportPrintDataResult
{
    public long PrescriptionId { get; set; }
    public long AppointmentId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string? PatientNationalCode { get; set; }
    public string? PatientBirthdate { get; set; }
    public string? PatientAge { get; set; }
    public string ExamDate { get; set; } = string.Empty;
    public EchoReportDto Echo { get; set; } = new();
}

public class EchoReportPrintDataQueryHandler : IRequestHandler<EchoReportPrintDataQuery, EchoReportPrintDataResult>
{
    private readonly IApplicationDbContext _db;

    public EchoReportPrintDataQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<EchoReportPrintDataResult> Handle(EchoReportPrintDataQuery request, CancellationToken cancellationToken)
    {
        var prescription = await _db.Prescriptions
            .AsNoTracking()
            .Include(p => p.EchoReport)
            .Include(p => p.Appointment)
                .ThenInclude(a => a.Patient)
            .FirstOrDefaultAsync(p => p.PrescriptionId == request.PrescriptionId, cancellationToken);

        if (prescription == null)
            throw new NotFoundExceptions("نسخه یافت نشد");

        if (prescription.EchoReport == null)
            throw new BadRequestExceptions("گزارش اکو برای این نسخه ثبت نشده است");

        var patient = prescription.Appointment?.Patient;
        var age = patient?.Birthdate != null
            ? ((int)((DateTime.Today - patient.Birthdate.Value.Date).TotalDays / 365.25)).ToString()
            : null;

        return new EchoReportPrintDataResult
        {
            PrescriptionId = prescription.PrescriptionId,
            AppointmentId = prescription.AppointmentId,
            PatientName = patient == null ? string.Empty : $"{patient.FirstName} {patient.LastName}".Trim(),
            PatientNationalCode = patient?.NationalCode,
            PatientBirthdate = patient?.Birthdate?.ToString("yyyy-MM-dd"),
            PatientAge = age,
            ExamDate = prescription.IssueDate.ToString("yyyy/MM/dd"),
            Echo = MapEcho(prescription.EchoReport),
        };
    }

    private static EchoReportDto MapEcho(Domain.Orders.Entities.EchoReport e) => new()
    {
        EchoReportId = e.EchoReportId,
        PrescriptionId = e.PrescriptionId,
        Phm = e.Phm,
        Rvid = e.Rvid,
        Lvidd = e.Lvidd,
        Lvids = e.Lvids,
        Ivsd = e.Ivsd,
        Pwd = e.Pwd,
        Lvef = e.Lvef,
        SimpsonEf = e.SimpsonEf,
        LvMass = e.LvMass,
        Sm = e.Sm,
        TelIndex = e.TelIndex,
        AvAnnulus = e.AvAnnulus,
        SinusValsalva = e.SinusValsalva,
        StJunction = e.StJunction,
        Acs = e.Acs,
        AscAo = e.AscAo,
        LaArea = e.LaArea,
        LaDia = e.LaDia,
        LaVolume = e.LaVolume,
        Edv = e.Edv,
        Esv = e.Esv,
        Mve = e.Mve,
        Mva = e.Mva,
        Mvdt = e.Mvdt,
        Mvpht = e.Mvpht,
        MvMean = e.MvMean,
        MvArea = e.MvArea,
        MvAnnulus = e.MvAnnulus,
        PvsMax = e.PvsMax,
        PvdMax = e.PvdMax,
        DtiEm = e.DtiEm,
        DtiAm = e.DtiAm,
        AovMax = e.AovMax,
        LvotVmax = e.LvotVmax,
        LvotVti = e.LvotVti,
        AvVti = e.AvVti,
        AoPeak = e.AoPeak,
        AoMean = e.AoMean,
        Ava = e.Ava,
        At = e.At,
        AovMg = e.AovMg,
        AovPg = e.AovPg,
        TrgMax = e.TrgMax,
        Rvsp = e.Rvsp,
        Pap = e.Pap,
        TvMean = e.TvMean,
        TvAnnulus = e.TvAnnulus,
        TvMg = e.TvMg,
        TvPg = e.TvPg,
        PvMax = e.PvMax,
        PvPg = e.PvPg,
        PvVti = e.PvVti,
        RvotVti = e.RvotVti,
        Piphi = e.Piphi,
        Ivc = e.Ivc,
        RaArea = e.RaArea,
        SeptalE = e.SeptalE,
        LateralE = e.LateralE,
        SPrime = e.SPrime,
        APrime = e.APrime,
        SmTdi = e.SmTdi,
        Tapsie = e.Tapsie,
        Conclusion = e.Conclusion,
        Recommendation = e.Recommendation,
    };
}

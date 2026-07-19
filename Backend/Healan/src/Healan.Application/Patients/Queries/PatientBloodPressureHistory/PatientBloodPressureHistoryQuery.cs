using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.PatientArea;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Patients.Queries.PatientBloodPressureHistory;

public class PatientBloodPressureHistoryQuery : IRequest<PatientBloodPressureHistoryResult>
{
    public string? NationalCode { get; set; }
    public long? PatientId { get; set; }
}

public class PatientBloodPressureHistoryResult
{
    public long PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string NationalCode { get; set; } = string.Empty;
    public List<PortalBloodPressureDto> Items { get; set; } = new();
}

public class PatientBloodPressureHistoryQueryHandler
    : IRequestHandler<PatientBloodPressureHistoryQuery, PatientBloodPressureHistoryResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IClinicAccessScopeService _clinicAccess;

    public PatientBloodPressureHistoryQueryHandler(
        IApplicationDbContext db,
        IClinicAccessScopeService clinicAccess)
    {
        _db = db;
        _clinicAccess = clinicAccess;
    }

    public async Task<PatientBloodPressureHistoryResult> Handle(
        PatientBloodPressureHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);
        var patients = _db.Patients.AsNoTracking().ApplyClinicScope(scope);

        long patientId;
        if (request.PatientId is > 0)
        {
            patientId = request.PatientId.Value;
        }
        else
        {
            var national = RagQuotaHelper.ToAsciiDigits(request.NationalCode);
            if (national.Length != 10)
                throw new BadRequestExceptions("کد ملی نامعتبر است.");

            patientId = await patients
                .Where(p => p.NationalCode == national && !p.IsDeleted)
                .OrderByDescending(p => p.PatientId)
                .Select(p => p.PatientId)
                .FirstOrDefaultAsync(cancellationToken);

            if (patientId <= 0)
                throw new NotFoundExceptions("بیماری با این کد ملی یافت نشد.");
        }

        var patient = await patients
            .Where(p => p.PatientId == patientId && !p.IsDeleted)
            .Select(p => new { p.PatientId, p.FirstName, p.LastName, p.NationalCode })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundExceptions("بیمار یافت نشد یا به این بیمار دسترسی ندارید.");

        var rows = await _db.PatientBloodPressureLogs.AsNoTracking()
            .Where(x => x.PatientId == patient.PatientId && !x.IsDeleted)
            .OrderByDescending(x => x.MeasuredAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return new PatientBloodPressureHistoryResult
        {
            PatientId = patient.PatientId,
            FirstName = patient.FirstName ?? string.Empty,
            LastName = patient.LastName ?? string.Empty,
            NationalCode = patient.NationalCode ?? string.Empty,
            Items = rows.Select(PortalBloodPressureListQueryHandler.MapBp).ToList(),
        };
    }
}

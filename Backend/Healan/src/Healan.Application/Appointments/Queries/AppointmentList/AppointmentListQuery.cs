using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Appointments.Dtos;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Appointments.Queries.AppointmentList;

public class AppointmentListQuery : AbstractSearchRequest<PaginatedList<AppointmentSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class AppointmentListQueryHandler : IRequestHandler<AppointmentListQuery, PaginatedList<AppointmentSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public AppointmentListQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<PaginatedList<AppointmentSummaryResult>> Handle(
        AppointmentListQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var query = _applicationDbContext.Appointments
            .Include(x => x.Invoices)
            .Include(x => x.ServiceTypes)
            .Include(x => x.Patient)
            .Include(x => x.Doctor)
            .Include(x => x.PrimaryInsuranceCompany)
            .Include(x => x.SecondInsuranceCompany)
            .Include(x => x.Prescriptions).ThenInclude(p => p.EchoReport)
            .Where(x =>
                (
                    request.StartDate.HasValue && request.EndDate.HasValue
                        ? x.AppointmentDate >= request.StartDate.Value && x.AppointmentDate <= request.EndDate.Value
                        : request.StartDate.HasValue && !request.EndDate.HasValue
                            ? x.AppointmentDate >= request.StartDate.Value
                            : !request.StartDate.HasValue && request.EndDate.HasValue
                                ? x.AppointmentDate <= request.EndDate.Value
                                : true
                )
                && (
                    string.IsNullOrEmpty(request.FilterText)
                    || x.Patient.NationalCode.Contains(request.FilterText)
                    || x.Patient.FirstName.Contains(request.FilterText)
                    || x.Patient.LastName.Contains(request.FilterText)
                    || x.Doctor.NationalCode.Contains(request.FilterText)
                    || x.Doctor.FirstName.Contains(request.FilterText)
                    || x.Doctor.LastName.Contains(request.FilterText)
                ))
            .ApplyClinicScope(scope)
            .AsNoTracking();

        var result = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenBy(x => x.Doctor.LastName)
            .ThenBy(x => x.Doctor.FirstName)
            .ProjectTo<AppointmentSummaryResult>(_mapper.ConfigurationProvider)
            .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

        await AppointmentSummaryEnricher.EnrichPatientVisitHistoryFlagsAsync(
            _applicationDbContext, result.Items, cancellationToken);
        return result;
    }
}

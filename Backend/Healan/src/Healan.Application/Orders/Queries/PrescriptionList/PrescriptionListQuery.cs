using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Orders.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Orders.Queries.PrescriptionList;

public class PrescriptionListQuery : AbstractSearchRequest<PaginatedList<PrescriptionSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class PrescriptionListQueryHandler : IRequestHandler<PrescriptionListQuery, PaginatedList<PrescriptionSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public PrescriptionListQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<PaginatedList<PrescriptionSummaryResult>> Handle(
        PrescriptionListQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var query = _applicationDbContext.Prescriptions
            .Include(x => x.Appointment).ThenInclude(x => x.Patient)
            .Include(x => x.Appointment).ThenInclude(x => x.Doctor)
            .Include(x => x.PrescriptionDrugs)
            .Include(x => x.ImagingRequests).ThenInclude(x => x.ImagingResults)
            .Include(x => x.ImagingRequests).ThenInclude(x => x.Attachment)
            .Include(x => x.LabTestRequests).ThenInclude(x => x.LabTestResults)
            .Include(x => x.LabTestRequests).ThenInclude(x => x.Attachment)
            .Include(x => x.EchoReport)
            .ApplyClinicScope(scope)
            .AsNoTracking();

        return await query
            .ProjectTo<PrescriptionSummaryResult>(_mapper.ConfigurationProvider)
            .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}

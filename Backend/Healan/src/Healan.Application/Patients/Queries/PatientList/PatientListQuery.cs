using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Patients.Queries.PatientList;

public class PatientListQuery : AbstractSearchRequest<PaginatedList<PatientSummaryResult>>
{
    public string? FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class PatientListQueryHandler : IRequestHandler<PatientListQuery, PaginatedList<PatientSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public PatientListQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<PaginatedList<PatientSummaryResult>> Handle(
        PatientListQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var query = _applicationDbContext.Patients
            .AsNoTracking()
            .ApplyClinicScope(scope);

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(p =>
                (p.NationalCode != null && p.NationalCode.Contains(filter))
                || (p.FirstName != null && p.FirstName.Contains(filter))
                || (p.LastName != null && p.LastName.Contains(filter))
                || (p.PhoneNumber != null && p.PhoneNumber.Contains(filter)));
        }

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .ProjectTo<PatientSummaryResult>(_mapper.ConfigurationProvider)
            .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}

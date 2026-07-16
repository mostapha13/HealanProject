using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.Doctors.Queries.DoctorList;

public class DoctorListQuery : AbstractSearchRequest<PaginatedList<DoctorSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class DoctorListQueryHandler : IRequestHandler<DoctorListQuery, PaginatedList<DoctorSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public DoctorListQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<PaginatedList<DoctorSummaryResult>> Handle(
        DoctorListQuery request,
        CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var query = _applicationDbContext.Doctors
            .AsNoTracking()
            .ApplyClinicScope(scope);

        if (!string.IsNullOrWhiteSpace(request.FilterText))
        {
            var filter = request.FilterText.Trim();
            query = query.Where(d =>
                (d.NationalCode != null && d.NationalCode.Contains(filter))
                || (d.FirstName != null && d.FirstName.Contains(filter))
                || (d.LastName != null && d.LastName.Contains(filter))
                || (d.Mobile != null && d.Mobile.Contains(filter)));
        }

        return await query
            .OrderByDescending(d => d.CreatedAt)
            .ProjectTo<DoctorSummaryResult>(_mapper.ConfigurationProvider)
            .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
    }
}

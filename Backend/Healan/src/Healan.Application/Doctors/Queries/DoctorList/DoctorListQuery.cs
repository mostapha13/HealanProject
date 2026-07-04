using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using MediatR;
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

    public DoctorListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }

    public async Task<PaginatedList<DoctorSummaryResult>> Handle(DoctorListQuery request, CancellationToken cancellationToken)
    {

        var query = from doctor in _applicationDbContext.Doctors
                    select doctor;

        return await query.ProjectTo<DoctorSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}

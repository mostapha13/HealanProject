using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using MediatR;
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

    public PatientListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<PatientSummaryResult>> Handle(PatientListQuery request, CancellationToken cancellationToken)
    {
        var query = from patient in _applicationDbContext.Patients
                    select patient;

        return await query.ProjectTo<PatientSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}

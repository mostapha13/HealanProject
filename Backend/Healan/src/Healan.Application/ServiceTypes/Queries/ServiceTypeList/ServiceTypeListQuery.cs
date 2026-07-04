using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.ServiceTypes.Dtos;
using MediatR;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.ServiceTypes.Queries.ServiceTypeList;
public class ServiceTypeListQuery : AbstractSearchRequest<PaginatedList<ServiceTypeSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}


public class ServiceTypeListQueryHandler : IRequestHandler<ServiceTypeListQuery, PaginatedList<ServiceTypeSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public ServiceTypeListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<ServiceTypeSummaryResult>> Handle(ServiceTypeListQuery request, CancellationToken cancellationToken)
    {
        var query = from serviceType in _applicationDbContext.ServiceTypes
                    select serviceType;

        return await query.ProjectTo<ServiceTypeSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}

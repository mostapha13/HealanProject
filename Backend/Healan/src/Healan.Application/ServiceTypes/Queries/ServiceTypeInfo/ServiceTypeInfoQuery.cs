using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using Healan.Application.ServiceTypes.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.ServiceTypes.Queries.ServiceTypeInfo;
public class ServiceTypeInfoQuery : AbstractSearchRequest<ServiceTypeSummaryResult>
{
    public long ServiceTypeId { get; set; }

}

public class ServiceTypeInfoQueryHandler : IRequestHandler<ServiceTypeInfoQuery, ServiceTypeSummaryResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public ServiceTypeInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<ServiceTypeSummaryResult> Handle(ServiceTypeInfoQuery request, CancellationToken cancellationToken)
    {
        var query = from serviceType in _applicationDbContext.ServiceTypes
                    where serviceType.ServiceTypeId == request.ServiceTypeId
                    select serviceType;

        return await query.ProjectTo<ServiceTypeSummaryResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}

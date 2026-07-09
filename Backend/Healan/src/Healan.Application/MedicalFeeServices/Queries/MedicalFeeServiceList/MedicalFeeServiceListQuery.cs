using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.MedicalFeeServices.Dtos;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceList;
public class MedicalFeeServiceListQuery : AbstractSearchRequest<PaginatedList<MedicalFeeServiceInfoResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class MedicalFeeServiceListQueryHandler : IRequestHandler<MedicalFeeServiceListQuery, PaginatedList<MedicalFeeServiceInfoResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdentityTool _identityTool;
    public MedicalFeeServiceListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService, IIdentityTool identityTool)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _currentUserService = currentUserService;
        _identityTool = identityTool;
    }
    public async Task<PaginatedList<MedicalFeeServiceInfoResult>> Handle(MedicalFeeServiceListQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.MedicalFeeServices
            .Include(s => s.ServiceType)
            .Where(m => m.ServiceType.IsActive);
        return await query.ProjectTo<MedicalFeeServiceInfoResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);


    }
}

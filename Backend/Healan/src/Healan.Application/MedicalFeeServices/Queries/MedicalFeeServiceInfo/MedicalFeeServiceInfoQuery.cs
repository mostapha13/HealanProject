using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.MedicalFeeServices.Dtos;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;

namespace Healan.Application.MedicalFeeServices.Queries.MedicalFeeServiceInfo;
public class MedicalFeeServiceInfoQuery : IRequest<MedicalFeeServiceInfoResult>
{
    public long MedicalFeeServiceId { get; set; }

}

public class MedicalFeeServiceInfoQueryHandler : IRequestHandler<MedicalFeeServiceInfoQuery, MedicalFeeServiceInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIdentityTool _identityTool;
    public MedicalFeeServiceInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService, IIdentityTool identityTool)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _currentUserService = currentUserService;
        _identityTool = identityTool;
    }
    public async Task<MedicalFeeServiceInfoResult> Handle(MedicalFeeServiceInfoQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.MedicalFeeServices.Include(s => s.ServiceType)
             .Where(x => x.MedicalFeeServiceId == request.MedicalFeeServiceId);
        return await query.ProjectTo<MedicalFeeServiceInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }
}

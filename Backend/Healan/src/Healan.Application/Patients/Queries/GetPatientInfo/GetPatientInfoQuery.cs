using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Patients.Queries.GetPatientInfo;
public class GetPatientInfoQuery : IRequest<PatientInfoResult>
{
    public long PatientId { get; set; }
}

public class GetPatientInfoQueryHandler : IRequestHandler<GetPatientInfoQuery, PatientInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetPatientInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PatientInfoResult> Handle(GetPatientInfoQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Patients.Where(p => p.PatientId == request.PatientId);
                  

        return await query.ProjectTo<PatientInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}

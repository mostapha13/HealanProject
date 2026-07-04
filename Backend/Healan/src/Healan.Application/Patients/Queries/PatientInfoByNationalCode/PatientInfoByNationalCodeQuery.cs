using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Patients.Queries.PatientInfoByNationalCode;
public class PatientInfoByNationalCodeQuery : IRequest<PatientInfoResult>
{
    public string nationalCode { get; set; }
}


public class PatientInfoByNationalCodeQueryHandler : IRequestHandler<PatientInfoByNationalCodeQuery, PatientInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public PatientInfoByNationalCodeQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }

    public async Task<PatientInfoResult> Handle(PatientInfoByNationalCodeQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Patients.Where(p => p.NationalCode == request.nationalCode);

        return await query.ProjectTo<PatientInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }
}

using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Patients.Queries.GetPatientInfo;

public class GetPatientInfoQuery : IRequest<PatientInfoResult>
{
    public long PatientId { get; set; }
}

public class GetPatientInfoQueryHandler : IRequestHandler<GetPatientInfoQuery, PatientInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IClinicAccessScopeService _clinicAccess;

    public GetPatientInfoQueryHandler(
        IApplicationDbContext applicationDbContext,
        IMapper mapper,
        IClinicAccessScopeService clinicAccess)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _clinicAccess = clinicAccess;
    }

    public async Task<PatientInfoResult> Handle(GetPatientInfoQuery request, CancellationToken cancellationToken)
    {
        var scope = await _clinicAccess.ResolveAsync(cancellationToken);

        var result = await _applicationDbContext.Patients
            .AsNoTracking()
            .Where(p => p.PatientId == request.PatientId)
            .ApplyClinicScope(scope)
            .ProjectTo<PatientInfoResult>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken);

        if (result == null)
            throw new NotFoundExceptions("بیمار یافت نشد یا به این بیمار دسترسی ندارید");

        return result;
    }
}

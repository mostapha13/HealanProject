using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Doctors.Queries.GetDoctorInfo;
public class GetDoctorInfoQuery : IRequest<DoctorInfoResult>
{
    public long DoctorId { get; set; }
}


public class GetDoctorInfoQueryHandler : IRequestHandler<GetDoctorInfoQuery, DoctorInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetDoctorInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }

    public async Task<DoctorInfoResult> Handle(GetDoctorInfoQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.Doctors
            .Include(x => x.Company)
            .Where(x => x.DoctorId == request.DoctorId);
        return await query.ProjectTo<DoctorInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
    }
}

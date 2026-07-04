using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using Healan.Application.Insurances.Dtos;
using Healan.Domain.Insurances.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Queries.GetInsuranceInfo;
public class GetInsuranceInfoQuery : IRequest<InsuranceInfoResult>
{
    public long InsuranceCompanyId { get; set; }
}

public class GetInsuranceInfoQueryHandler : IRequestHandler<GetInsuranceInfoQuery, InsuranceInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetInsuranceInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<InsuranceInfoResult> Handle(GetInsuranceInfoQuery request, CancellationToken cancellationToken)
    {

        var query =  _applicationDbContext.InsuranceCompanies.Include(x => x.Attachment)
            .Where(x => x.InsuranceCompanyId == request.InsuranceCompanyId);
        return await query.ProjectTo<InsuranceInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}

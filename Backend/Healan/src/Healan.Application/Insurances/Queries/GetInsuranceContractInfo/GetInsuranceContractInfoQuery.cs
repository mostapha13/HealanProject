using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Insurances.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Queries.GetInsuranceContractInfo;
    public class GetInsuranceContractInfoQuery : IRequest<InsuranceContractInfoResult>
    {
        public long InsuranceContractId { get; set; }
    }

public class GetInsuranceContractInfoQueryHandler : IRequestHandler<GetInsuranceContractInfoQuery, InsuranceContractInfoResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public GetInsuranceContractInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<InsuranceContractInfoResult> Handle(GetInsuranceContractInfoQuery request, CancellationToken cancellationToken)
    {
        var query = _applicationDbContext.InsuranceContracts
            .Include(x => x.Attachment)
            .Include(x=>x.InsuranceCompany)
         .Where(x => x.InsuranceContractId == request.InsuranceContractId);
        return await query.ProjectTo<InsuranceContractInfoResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();

    }
}

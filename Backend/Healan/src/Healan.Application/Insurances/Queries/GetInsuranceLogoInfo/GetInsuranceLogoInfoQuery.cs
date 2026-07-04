//using AutoMapper;
//using AutoMapper.QueryableExtensions;
//using Healan.Application.Common.Interfaces;
//using Healan.Application.Insurances.Dtos;
//using MediatR;
//using Microsoft.EntityFrameworkCore;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Healan.Application.Insurances.Queries.GetInsuranceLogoInfo;
//    public class GetInsuranceLogoInfoQuery: InsuranceLogoRequest, IRequest<InsuranceLogoSummaryResult>
//    {
//    }

//public class GetInsuranceLogoInfoQueryHandler : IRequestHandler<GetInsuranceLogoInfoQuery, InsuranceLogoSummaryResult>
//{
//    private readonly IApplicationDbContext _applicationDbContext;
//    private readonly IMapper _mapper;
//    public GetInsuranceLogoInfoQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
//    {
//        _applicationDbContext = applicationDbContext;
//        _mapper = mapper;
//    }

//    public async Task<InsuranceLogoSummaryResult> Handle(GetInsuranceLogoInfoQuery request, CancellationToken cancellationToken)
//    {
//        var query = from insuranceLogo in _applicationDbContext.InsuranceLogos
//                    .Include(l=>l.Attachment)
//                    .Include(l=>l.Insurance)
//                    select insuranceLogo;

//        return await query.ProjectTo<InsuranceLogoSummaryResult>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();
//    }
//}

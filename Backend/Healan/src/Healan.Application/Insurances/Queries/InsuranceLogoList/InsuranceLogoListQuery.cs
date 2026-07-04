//using AutoMapper;
//using AutoMapper.QueryableExtensions;
//using FileManager.GrpcClient.Interfaces;
//using Healan.Application.Common.Interfaces;
//using Healan.Application.Companies.Dtos;
//using Healan.Application.Insurances.Dtos;
//using MediatR;
//using Microsoft.EntityFrameworkCore;
//using Share.Application.Common.Mapping;
//using Share.Application.Common.Models;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace Healan.Application.Insurances.Queries.InsuranceLogoList;

//public class InsuranceLogoListQuery : AbstractSearchRequest<PaginatedList<InsuranceLogoSummaryResult>>
//{
//    public string FilterText { get; set; }
//    public int PageNumber { get; set; }
//    public int PageSize { get; set; }
//}

//public class InsuranceLogoListQueryHandler : IRequestHandler<InsuranceLogoListQuery, PaginatedList<InsuranceLogoSummaryResult>>
//{
//    private readonly IMapper _mapper;
//    private readonly IFileManagerTool _FileManagerTool;
//    private readonly IApplicationDbContext _applicationDbContext;

//    public InsuranceLogoListQueryHandler(IApplicationDbContext applicationDbContext, IFileManagerTool fileManagerTool, IMapper mapper)
//    {
//        _applicationDbContext = applicationDbContext;
//        _FileManagerTool = fileManagerTool;
//        _mapper = mapper;
//    }

//    public async Task<PaginatedList<InsuranceLogoSummaryResult>> Handle(InsuranceLogoListQuery request, CancellationToken cancellationToken)
//    {

//        var query = from insuranceLogo in _applicationDbContext.InsuranceLogos
//        .Include(x => x.Attachment)
//        .Include(x => x.Insurance)
//                    where
//                                    (
//                                    request == null ||
//                                    string.IsNullOrEmpty(request.FilterText) ||
//                                    insuranceLogo.Insurance.InsuranceName.Contains(request.FilterText))
//                    select insuranceLogo;
//        return await query.OrderByDescending(x => x.CreatedAt).ProjectTo<InsuranceLogoSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

//    }
//}

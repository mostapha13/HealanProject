using AutoMapper;
using AutoMapper.QueryableExtensions;
using Healan.Application.Common.Interfaces;
using Healan.Application.Insurances.Dtos;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Application.Insurances.Queries.InsuranceContractList;
    public class InsuranceContractListQuery : AbstractSearchRequest<PaginatedList<InsuranceContractSummaryResult>>
{
    public string FilterText { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
}

public class InsuranceContractListQueryHandler : IRequestHandler<InsuranceContractListQuery, PaginatedList<InsuranceContractSummaryResult>>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;

    public InsuranceContractListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
    }
    public async Task<PaginatedList<InsuranceContractSummaryResult>> Handle(InsuranceContractListQuery request, CancellationToken cancellationToken)
    {
        var query = from insuranceContracts in _applicationDbContext
                    .InsuranceContracts
                    .Include(x=>x.Attachment)
                    .Include(x=>x.InsuranceContractServices)
                    select insuranceContracts;

        return await query.ProjectTo<InsuranceContractSummaryResult>(_mapper.ConfigurationProvider).PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

    }
}

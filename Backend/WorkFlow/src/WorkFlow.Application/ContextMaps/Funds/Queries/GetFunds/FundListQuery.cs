using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

namespace WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds
{
    public class FundListQuery : AbstractSearchRequest<PaginatedList<FundResponse>>
    {
        public string FundName { get; set; }
    }
    public class FundListQueryHandler : IRequestHandler<FundListQuery, PaginatedList<FundResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public FundListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<PaginatedList<FundResponse>> Handle(FundListQuery request, CancellationToken cancellationToken)
        {
            var query = _applicationDbContext
                .Funds
                .AsNoTracking();

            return await query.ProjectTo<FundResponse>(_mapper.ConfigurationProvider)
                .Where(w => string.IsNullOrEmpty(request.FundName) || w.FundName.Contains(request.FundName))
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
        }
    }

}

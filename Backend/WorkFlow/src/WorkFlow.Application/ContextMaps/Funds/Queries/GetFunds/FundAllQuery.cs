using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds
{
    public class FundAllQuery : AbstractRequestBase<List<FundResponse>>
    {
        public Guid? FundId { get; set; }
        public string FundName { get; set; }
    }
    public class FundAllQueryHandler : IRequestHandler<FundAllQuery, List<FundResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        public FundAllQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
        }
        public async Task<List<FundResponse>> Handle(FundAllQuery request, CancellationToken cancellationToken)
        {
            var query = _applicationDbContext
                .Funds
                .AsNoTracking();

            return await query.ProjectTo<FundResponse>(_mapper.ConfigurationProvider)
                .Where(w =>
                (string.IsNullOrEmpty(request.FundName) || w.FundName.Contains(request.FundName)) &&
                   (!request.FundId.HasValue || w.FundId == request.FundId)
                )
                .ToListAsync(cancellationToken);
        }
    }

}

using MediatR;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Funds.Command.SaveFund
{
    public class FundSaveCommand : IRequest<FundResponse>
    {
        public Guid? FundId { get; set; }
        public string FundName { get; set; }
    }
    public class FundSaveCommandHandler : IRequestHandler<FundSaveCommand, FundResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public FundSaveCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<FundResponse> Handle(FundSaveCommand request, CancellationToken cancellationToken)
        {
            var Fund = _applicationDbContext.Funds.FirstOrDefault(x => x.FundId == request.FundId);
            if (Fund == null)
            {
                Fund = new Fund();
                _applicationDbContext.Funds.Add(Fund);
            }
            Fund.FundName = request.FundName;
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return new FundResponse()
            {
                FundId = Fund.FundId,
                FundName = Fund.FundName
            };
        }
    }
}

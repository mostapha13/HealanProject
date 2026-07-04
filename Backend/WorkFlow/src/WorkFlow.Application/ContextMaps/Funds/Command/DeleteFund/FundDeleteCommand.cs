using WorkFlow.Application.Common.Interfaces;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Share.Domain.Exceptions;

namespace WorkFlow.Application.ContextMaps.Funds.Command.DeleteFund
{
    public class FundDeleteCommand : IRequest<Unit>
    {
        public Guid FundId { get; set; }
    }
    public class FundDeleteCommandHandler : IRequestHandler<FundDeleteCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public FundDeleteCommandHandler(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }
        public async Task<Unit> Handle(FundDeleteCommand request, CancellationToken cancellationToken)
        {
            var Fund = _applicationDbContext.Funds.FirstOrDefault(x => x.FundId == request.FundId);
            if (Fund == null)
                throw new BadRequestExceptions("Fund Not Exists!");
            _applicationDbContext.Funds.Remove(Fund);
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return Unit.Value;
        }
    }
}

using FluentValidation;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.Funds.Command.DeleteFund
{
    public class FundDeleteCommandValidator : AbstractValidator<FundDeleteCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public FundDeleteCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a).Custom((dt, context) =>
            {
                if (_applicationDbContext.WorkFlowUsers.Any(a => a.FundId == dt.FundId))
                    context.AddFailure(ValidationMessages.CantDeleteFund);
            });
        }
    }
}

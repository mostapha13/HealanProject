using FluentValidation;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Funds.Command.SaveFund
{
    public class FundSaveCommandValidator : AbstractValidator<FundSaveCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public FundSaveCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a.FundName).NotEmpty().WithMessage(ValidationMessages.FundNameIsNotValid).MinimumLength(3).WithMessage(ValidationMessages.FundNameIsNotValid).MaximumLength(100).WithMessage(ValidationMessages.FundNameIsNotValid);
            RuleFor(a => a).Custom((dt, context) =>
            {
                if (_applicationDbContext.Funds.Any(a => a.FundName == dt.FundName && a.FundId != dt.FundId))
                    context.AddFailure(ValidationMessages.FundNameIsDuplicated);
            });
        }
    }
}

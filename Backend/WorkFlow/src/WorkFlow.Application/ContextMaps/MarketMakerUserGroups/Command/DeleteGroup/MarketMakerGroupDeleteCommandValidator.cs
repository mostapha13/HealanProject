using FluentValidation;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.DeleteGroup
{
    public class WorkFlowGroupDeleteCommandValidator : AbstractValidator<WorkFlowGroupDeleteCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowGroupDeleteCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a).Custom((dt, context) =>
            {
                if (_applicationDbContext.WorkFlowUsers.Any(a => a.WorkFlowUserGroupId == dt.WorkFlowUserGroupId))
                    context.AddFailure(ValidationMessages.CantDeleteUserGroup);
            });
        }
    }
}

using FluentValidation;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Command.SaveGroup
{
    public class WorkFlowGroupSaveCommandValidator : AbstractValidator<WorkFlowGroupSaveCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowGroupSaveCommandValidator(IApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a.GroupName).NotEmpty().WithMessage(ValidationMessages.GroupNameIsNotValid).MinimumLength(3).WithMessage(ValidationMessages.GroupNameIsNotValid).MaximumLength(100).WithMessage(ValidationMessages.GroupNameIsNotValid);
            RuleFor(a => a).Custom((dt, context) =>
            {
                if (_applicationDbContext.WorkFlowUserGroups.Any(a => a.GroupName == dt.GroupName && a.WorkFlowUserGroupId != dt.WorkFlowUserGroupId))
                    context.AddFailure(ValidationMessages.GroupNameIsDuplicated);
            });
        }
    }
}

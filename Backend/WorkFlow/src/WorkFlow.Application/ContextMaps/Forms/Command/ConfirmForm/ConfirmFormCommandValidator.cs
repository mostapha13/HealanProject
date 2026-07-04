using FluentValidation;
using Share.Application.Common.Interfaces;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Forms.Command.ConfirmForm
{
    public class ConfirmFormCommandValidator : AbstractValidator<ConfirmFormCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        public ConfirmFormCommandValidator(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService)
        {
#if !DEBUG
            _applicationDbContext = applicationDbContext;
            RuleFor(a => a).Custom((dt, context) =>
            {

                var cuurentUserId = _currentUserService.UserId;
                WorkFlowUser WorkFlowUser = null;
                if (cuurentUserId == Guid.Empty)
                {
                    context.AddFailure(ValidationMessages.Public_YouMustLogin);
                    return;
                }
                WorkFlowUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(w => w.IdentityUserId == cuurentUserId);
                var workFlow = _applicationDbContext.WorkFlowItems.Where(w => w.OrderId == dt.OrderId).FirstOrDefault();
                if (workFlow != null)
                {
                    var WorkFlowGuide = _applicationDbContext.WorkFlowGuides.Where(w => w.WorkFlowGuideId == workFlow.WorkFlowGuideId).FirstOrDefault();
                    if (WorkFlowGuide != null)
                    {
                        if (WorkFlowUser.WorkFlowUserGroupId != WorkFlowGuide.ReceiverGroupId)
                        {
                            context.AddFailure(ValidationMessages.ConfirmForm_ItemNotInYourCartboard);
                            return;
                        }
                    }
                }
            });
            _currentUserService = currentUserService;
#endif
        }
    }
}

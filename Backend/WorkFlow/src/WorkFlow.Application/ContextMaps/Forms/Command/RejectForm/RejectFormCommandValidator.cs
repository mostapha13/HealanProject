using FluentValidation;
using Share.Application.Common.Interfaces;
using WorkFlow.Application.Common.Constant;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Forms.Command.RejectForm
{
    public class RejectFormCommandValidator : AbstractValidator<RejectFormCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        public RejectFormCommandValidator(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService)
        {
#if !DEBUG
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
            RuleFor(a => a).Custom((dt, context) =>
            {

                var cuurentUserId = _currentUserService.UserId;
                WorkFlowUser workFlowUser = null;
                if (cuurentUserId == Guid.Empty)
                {
                    context.AddFailure(ValidationMessages.Public_YouMustLogin);
                    return;
                }
                workFlowUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(w => w.IdentityUserId == cuurentUserId);
                var workFlow = _applicationDbContext.WorkFlowItems.Where(w => w.OrderId == dt.OrderId).FirstOrDefault();
                if (workFlow != null)
                {
                    var WorkFlowGuide = _applicationDbContext.WorkFlowGuides.Where(w => w.WorkFlowGuideId == workFlow.WorkFlowGuideId).FirstOrDefault();
                    if (WorkFlowGuide != null && workFlowUser != null)
                    {
                        if (workFlowUser.WorkFlowUserGroupId != WorkFlowGuide.ReceiverGroupId)
                        {
                            context.AddFailure(ValidationMessages.ConfirmForm_ItemNotInYourCartboard);
                            return;
                        }
                    }
                }


            });
#endif
        }
    }
}

using FluentValidation;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.DeleteUser
{
    public class WorkFlowUserDeleteCommandValidator : AbstractValidator<WorkFlowUserDeleteCommand>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        public WorkFlowUserDeleteCommandValidator(IApplicationDbContext applicationDbContext)
        {

        }
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Forms.Command.CheckIsOrderInCardbord
{
    public class IsOrderInCardbord : IRequest<bool>
    {
        public Guid OrderId { get; set; }
    }
    public class IsOrderInCardbordHandler : IRequestHandler<IsOrderInCardbord, bool>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWorkFlowGuidService _workFlowGuidService;
        private readonly ILogger<IsOrderInCardbordHandler> _logger;
        public IsOrderInCardbordHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IWorkFlowGuidService workFlowGuidService, ILogger<IsOrderInCardbordHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
            _workFlowGuidService = workFlowGuidService;
            _logger = logger;
        }

        public async Task<bool> Handle(IsOrderInCardbord request, CancellationToken cancellationToken)
        {
            _logger.LogWarning($"Start IsOrderInCardbordHandler...");
            var cuurentUserId = _currentUserService.UserId;

            WorkFlowUser WorkFlowUser = null;
            if (cuurentUserId == Guid.Empty)
            {
                return false;
            }
            WorkFlowUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(w => w.IdentityUserId == cuurentUserId);

            var currentWorkFlow = await _applicationDbContext.WorkFlowItems.Include(a => a.WorkFlowGuide).FirstOrDefaultAsync(p => p.OrderId == request.OrderId && p.WorkFlowGuide.ReceiverGroupId == WorkFlowUser.WorkFlowUserGroupId);

            if (currentWorkFlow == null)
                return false;

            return true;
        }
    }
}

using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;


namespace WorkFlow.Application.ContextMaps.Forms.Command.ConditionalConfirmForm
{
    public class ConditionalConfirmFormCommand : IRequest<Unit>
    {
        public Guid OrderId { get; set; }
        public string PublicMessage { get; set; }
        public string PrivateMessage { get; set; }
    }

    public class ConditionalConfirmFormCommandHandler : IRequestHandler<ConditionalConfirmFormCommand, Unit>
    {

        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWorkFlowGuidService _workFlowGuidService;
        private readonly ILogger<ConditionalConfirmFormCommandHandler> _logger;
        public ConditionalConfirmFormCommandHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService, IWorkFlowGuidService workFlowGuidService, ILogger<ConditionalConfirmFormCommandHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
            _workFlowGuidService = workFlowGuidService;
            _logger = logger;
        }

        public async Task<Unit> Handle(ConditionalConfirmFormCommand request, CancellationToken cancellationToken)
        {
            _logger.LogWarning($"Start ConfirmFormCommandHandler...");
            var cuurentUserId = _currentUserService.UserId;

            WorkFlowUser WorkFlowUser = null;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            }
            WorkFlowUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(w => w.IdentityUserId == cuurentUserId);

            var currentWorkFlow = await _applicationDbContext.WorkFlowItems.Include(a => a.WorkFlowGuide).FirstOrDefaultAsync(p => p.OrderId == request.OrderId && p.WorkFlowGuide.ReceiverGroupId == WorkFlowUser.WorkFlowUserGroupId);

            if (currentWorkFlow == null)
                throw new BadRequestExceptions("Current Work flow Is Null!");



            _applicationDbContext.WorkFlowItems.Remove(currentWorkFlow);

            _applicationDbContext.WorkFlowArchives.Add(new WorkFlowArchive()
            {
                OrderId = currentWorkFlow.OrderId,
                WorkFlowArchiveDate = DateTimeHelper.GetCurrentDateTime(),
                WorkFlowDate = currentWorkFlow.WorkFlowDate,
                WorkFlowItemId = currentWorkFlow.WorkFlowItemId,
                WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId,
                UserId = currentWorkFlow.UserId
            });


            var nextWorkFlowGuides = await _workFlowGuidService.GetNextWorkFlowGuidId(currentWorkFlow.WorkFlowGuideId, WeightId.Other);

            //if (nextWorkFlowGuide == null)
            //    return Unit.Value;


            var order = _applicationDbContext.Orders.Where(w => w.OrderId == currentWorkFlow.OrderId).FirstOrDefault();

            if (order == null)
                throw new BadRequestExceptions("Order Not Found!");

            WorkFlowItem nextWf = null;
            if (nextWorkFlowGuides != null)
            {
                foreach (var nextWorkFlowGuide in nextWorkFlowGuides)
                {


                    nextWf = new WorkFlowItem()
                    {
                        OrderId = currentWorkFlow.OrderId,
                        WorkFlowGuideId = nextWorkFlowGuide.WorkFlowGuideId,
                        WorkFlowDate = DateTimeHelper.GetCurrentDateTime(),
                        HasObserved = false,
                        UserId = cuurentUserId
                    };

                    _applicationDbContext.WorkFlowItems.Add(nextWf);

                    if (nextWorkFlowGuide.ReceiverGroupId == WorkFlowUserGroupId.MarketMaker)
                    {
                        order.OrderStatusId = OrderStatusId.Closed;
                        if (nextWorkFlowGuide.WorkFlowTypeId == WorkFlowTypeId.MarketMakerQuitOrderRequest)
                        {
                            order.IsDeny = true;
                        }
                    }
                }
            }

            if (!string.IsNullOrEmpty(request.PublicMessage))
                order.OrderComments.Add(new OrderComment() { Comment = request.PublicMessage, WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId, WorkFlowUserId = WorkFlowUser.WorkFlowUserId, CommentDate = DateTimeHelper.GetCurrentDateTime(), IsPrivate = false });
            if (!string.IsNullOrEmpty(request.PrivateMessage))
                order.OrderComments.Add(new OrderComment() { Comment = request.PrivateMessage, WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId, WorkFlowUserId = WorkFlowUser.WorkFlowUserId, CommentDate = DateTimeHelper.GetCurrentDateTime(), IsPrivate = true });

            _logger.LogWarning($"Before save");
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            _logger.LogWarning($"After save");


            return Unit.Value;
        }
    }
}

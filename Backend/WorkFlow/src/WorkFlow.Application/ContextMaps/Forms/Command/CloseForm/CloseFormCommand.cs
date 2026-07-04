using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;

namespace WorkFlow.Application.ContextMaps.Forms.Command.CloseForm
{
    public class CloseFormCommand : IRequest<Unit>
    {
        public Guid OrderId { get; set; }
        public string PublicMessage { get; set; }
        public string PrivateMessage { get; set; }
    }

    public class CloseFormCommandHandler : IRequestHandler<CloseFormCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;
        private readonly IWorkFlowGuidService _workFlowGuidService;
        public CloseFormCommandHandler(IApplicationDbContext applicationDbContext, IMediator mediator, ICurrentUserService currentUserService, IMapper mapper, IWorkFlowGuidService workFlowGuidService)
        {
            _applicationDbContext = applicationDbContext;
            _mediator = mediator;
            _currentUserService = currentUserService;
            _mapper = mapper;
            _workFlowGuidService = workFlowGuidService;
        }
        public async Task<Unit> Handle(CloseFormCommand request, CancellationToken cancellationToken)
        {
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


            var order = _applicationDbContext.Orders.Where(w => w.OrderId == currentWorkFlow.OrderId).FirstOrDefault();
            if (order == null)
                throw new BadRequestExceptions("Order Not Found!");



            order.OrderStatusId = OrderStatusId.Closed;
            order.IsDeny = true;

            if (!string.IsNullOrEmpty(request.PublicMessage))
                order.OrderComments.Add(new OrderComment() { Comment = request.PublicMessage, WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId, WorkFlowUserId = WorkFlowUser.WorkFlowUserId, CommentDate = DateTimeHelper.GetCurrentDateTime(), IsPrivate = false });
            if (!string.IsNullOrEmpty(request.PrivateMessage))
                order.OrderComments.Add(new OrderComment() { Comment = request.PrivateMessage, WorkFlowGuidId = currentWorkFlow.WorkFlowGuideId, WorkFlowUserId = WorkFlowUser.WorkFlowUserId, CommentDate = DateTimeHelper.GetCurrentDateTime(), IsPrivate = true });


            await _applicationDbContext.SaveChangesAsync(cancellationToken);



            return Unit.Value;
        }
    }
}

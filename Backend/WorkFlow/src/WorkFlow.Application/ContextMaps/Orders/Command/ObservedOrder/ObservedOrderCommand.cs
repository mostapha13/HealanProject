using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Orders.Command.ObservedOrder
{
    public class ObservedOrderCommand : IRequest<Unit>
    {
        public Guid? UserId { get; set; }
        public Guid OrderId { get; set; }
    }
    public class ObservedOrderCommandHandler : IRequestHandler<ObservedOrderCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public ObservedOrderCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<Unit> Handle(ObservedOrderCommand request, CancellationToken cancellationToken)
        {

            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            }

            var currenUser = await _applicationDbContext.WorkFlowUsers.Where(w => w.IdentityUserId == cuurentUserId).FirstOrDefaultAsync();


            var workflow = await _applicationDbContext.WorkFlowItems.Where(w => w.OrderId == request.OrderId && w.WorkFlowGuide.ReceiverGroupId == currenUser.WorkFlowUserGroupId).FirstOrDefaultAsync(cancellationToken);
            if (workflow != null)
            {
                workflow.HasObserved = true;
                await _applicationDbContext.SaveChangesAsync(cancellationToken);
            }
            return Unit.Value;
        }
    }

}

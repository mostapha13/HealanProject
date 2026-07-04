using AutoMapper;
using MediatR;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.Orders.Queries.GetOrders;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetForms
{
    public class GetOrderDetailFormById : AbstractRequestBase<OrderDetailFormByIdResponse>
    {
        public Guid? UserId { get; set; }
        public Guid OrderId { get; set; }
    }
    public class GetOrderDetailFormByIdHandler : IRequestHandler<GetOrderDetailFormById, OrderDetailFormByIdResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;
        public GetOrderDetailFormByIdHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IMediator mediator, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _mediator = mediator;
            _currentUserService = currentUserService;
        }
        public async Task<OrderDetailFormByIdResponse> Handle(GetOrderDetailFormById request, CancellationToken cancellationToken)
        {

            var orderQuery = new GetOrderQuery() { lang = LanguageId.Fa, OrderId = request.OrderId };
            var orderResponse = await _mediator.Send(orderQuery);



            OrderDetailFormByIdResponse orderDetailFormByIdResponse = new OrderDetailFormByIdResponse();
            orderDetailFormByIdResponse.Order = orderResponse;



            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            var currentUser = _applicationDbContext.WorkFlowUsers.Where(w => w.IdentityUserId == cuurentUserId).FirstOrDefault();

            if (currentUser == null)
                throw new BadRequestExceptions("ابتدا وارد سامانه شوید");

            orderDetailFormByIdResponse.WorkFlowGroup = new WorkFlowGroupResponse()
            {
                WorkFlowUserGroupId = currentUser.WorkFlowUserGroupId,
                GroupName = currentUser.WorkFlowUserGroupId.GetDisplayName()
            };


            var workFlow = _applicationDbContext.WorkFlowItems.Where(w => w.OrderId == request.OrderId && w.WorkFlowGuide.ReceiverGroupId == currentUser.WorkFlowUserGroupId).FirstOrDefault();
            Guid workFlowGuidId = Guid.Empty;








            if (workFlow != null)
            {
                if (!workFlow.HasObserved)
                {
                    workFlow.HasObserved = true;
                    await _applicationDbContext.SaveChangesAsync(cancellationToken);
                }
                var WorkFlowGuide = _applicationDbContext.WorkFlowGuides.Where(w => w.WorkFlowGuideId == workFlow.WorkFlowGuideId).FirstOrDefault();
                if (WorkFlowGuide != null)
                {
                    orderDetailFormByIdResponse.FormId = WorkFlowGuide.FormId;
                    orderDetailFormByIdResponse.CanConfirmOrReject = currentUser.WorkFlowUserGroupId == WorkFlowGuide.ReceiverGroupId;
                }
            }
            else
            {
                orderDetailFormByIdResponse.FormId = FormId.ExtendingOrder;
            }






            if (currentUser == null)
                throw new BadRequestExceptions("Current User Is Null");
            var isPrivateGroup = currentUser.WorkFlowUserGroupId != WorkFlowUserGroupId.MarketMaker;

            if (isPrivateGroup)
                orderDetailFormByIdResponse.PrivateMessages = _applicationDbContext.OrderComments.Where(w => w.IsPrivate && w.OrderId == request.OrderId).OrderByDescending(o => o.CommentDate)
                    .Select(s => new CommentSummary
                    {
                        Comment = s.Comment,
                        CommentDate = s.CommentDate,
                        MarketUserName = s.WorkFlowUser.FirstName + " " + s.WorkFlowUser.LastName
                    }).ToList();
            orderDetailFormByIdResponse.PublicMessages = _applicationDbContext.OrderComments.Where(w => !w.IsPrivate && w.OrderId == request.OrderId).OrderByDescending(o => o.CommentDate)
                .Select(s => new CommentSummary
                {
                    Comment = s.Comment,
                    CommentDate = s.CommentDate,
                    MarketUserName = s.WorkFlowUser.FirstName + " " + s.WorkFlowUser.LastName
                }).ToList();


            return orderDetailFormByIdResponse;
        }


        public static bool CanConfirmForm(WorkFlowUserGroupId marketMakerUserGroupId)
        {

            if (marketMakerUserGroupId == WorkFlowUserGroupId.MarketMakerExpert ||
                marketMakerUserGroupId == WorkFlowUserGroupId.MarketMakerManager
                )
                return true;
            return false;
        }


        public static bool IsCashMarketBroker(WorkFlowUserGroupId marketMakerUserGroupId)
        {

            if (marketMakerUserGroupId == WorkFlowUserGroupId.MarketMaker)
                return true;
            return false;
        }
    }


}

using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;

namespace WorkFlow.Application.ContextMaps.Forms.Queries.GetForms
{
    public class GetOrderWorkFlowById : AbstractRequestBase<OrderWorkFlowResponse>
    {
        public Guid? UserId { get; set; }
        public Guid OrderId { get; set; }
    }
    public class GetOrderWorkFlowByIdHandler : IRequestHandler<GetOrderWorkFlowById, OrderWorkFlowResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly IMediator _mediator;
        private readonly ICurrentUserService _currentUserService;
        public GetOrderWorkFlowByIdHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IMediator mediator, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _mediator = mediator;
            _currentUserService = currentUserService;
        }
        public async Task<OrderWorkFlowResponse> Handle(GetOrderWorkFlowById request, CancellationToken cancellationToken)
        {

            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            var currentUser = _applicationDbContext.WorkFlowUsers.Where(w => w.IdentityUserId == cuurentUserId).FirstOrDefault();
            if (currentUser == null)
                throw new BadRequestExceptions("Current User Is Null");

            OrderWorkFlowResponse orderWorkFlowResponse = new OrderWorkFlowResponse();
            orderWorkFlowResponse.Order = await _applicationDbContext.Orders.Where(w => w.OrderId == request.OrderId).ProjectTo<Order_WorkFlow_Response>(_mapper.ConfigurationProvider).FirstOrDefaultAsync();


            var q1 = from wa in _applicationDbContext.WorkFlowArchives
                     join wg in _applicationDbContext.WorkFlowGuides on wa.WorkFlowGuidId equals wg.WorkFlowGuideId
                     join wt in _applicationDbContext.WorkFlowTypes on wg.WorkFlowTypeId equals wt.WorkFlowTypeId
                     join sgroup in _applicationDbContext.WorkFlowUserGroups on wg.SenderGroupId equals sgroup.WorkFlowUserGroupId
                     join rgroup in _applicationDbContext.WorkFlowUserGroups on wg.ReceiverGroupId equals rgroup.WorkFlowUserGroupId
                     where wa.OrderId == request.OrderId
                     orderby wa.WorkFlowDate ascending
                     select new WorkFlowArchive_Simple_Response()
                     {
                         WorkFlowName = wt.WorkFlowName,
                         WorkFlowGuidId = wg.WorkFlowGuideId,
                         WorkFlowUserGroupId = wg.ReceiverGroupId,
                         Sender = sgroup.GroupName,
                         Receiver = rgroup.GroupName,
                         WorkFlowUserGroupKey = (int)wg.ReceiverGroupId,
                         WorkFlowDate = wa.WorkFlowDate,
                         HasObserved = true,
                     };

            var q2 = from wa in _applicationDbContext.WorkFlowItems
                     join wg in _applicationDbContext.WorkFlowGuides on wa.WorkFlowGuideId equals wg.WorkFlowGuideId
                     join wt in _applicationDbContext.WorkFlowTypes on wg.WorkFlowTypeId equals wt.WorkFlowTypeId
                     join sgroup in _applicationDbContext.WorkFlowUserGroups on wg.SenderGroupId equals sgroup.WorkFlowUserGroupId
                     join rgroup in _applicationDbContext.WorkFlowUserGroups on wg.ReceiverGroupId equals rgroup.WorkFlowUserGroupId
                     where wa.OrderId == request.OrderId
                     orderby wa.WorkFlowDate ascending
                     select new WorkFlowArchive_Simple_Response()
                     {
                         WorkFlowName = wt.WorkFlowName,
                         WorkFlowGuidId = wg.WorkFlowGuideId,
                         Sender = sgroup.GroupName,
                         Receiver = rgroup.GroupName,
                         WorkFlowUserGroupId = wg.ReceiverGroupId,
                         WorkFlowUserGroupKey = (int)wg.ReceiverGroupId,
                         WorkFlowDate = wa.WorkFlowDate,
                         HasObserved = wa.HasObserved
                     };

            var finalResult = q1.ToList().Concat(q2.ToList()).OrderByDescending(o => o.WorkFlowDate).ToList();

            var workflowType = await _applicationDbContext.WorkFlowItems.Include(g => g.WorkFlowGuide)
                .Where(x => x.OrderId == request.OrderId).FirstOrDefaultAsync();
            var allValidGroups = new List<WorkFlowUserGroupId>();
            if (workflowType != null)
            {
                var workflowTypeId = workflowType.WorkFlowGuide.WorkFlowTypeId;
                allValidGroups = await _applicationDbContext.WorkFlowGuides.Where(x => x.WorkFlowTypeId == workflowTypeId)
               .Select(x => x.SenderGroupId).ToListAsync();
            }
            else
            {
                allValidGroups = finalResult.Select(s => s.WorkFlowUserGroupId).ToList();
                //allValidGroups = new List<WorkFlowUserGroupId>() { WorkFlowUserGroupId.MarketMaker, WorkFlowUserGroupId.MarketMakerExpert, WorkFlowUserGroupId.MarketMakerOfficeBoss, WorkFlowUserGroupId.MarketMakerManager };
            }



            //var allValidGroups=new List<WorkFlowUserGroupId>() { WorkFlowUserGroupId.MarketMaker,WorkFlowUserGroupId.MarketMakerExpert, WorkFlowUserGroupId.MarketMakerOfficeBoss, WorkFlowUserGroupId.MarketMakerManager };


            var isPrivateGroup = currentUser.WorkFlowUserGroupId != WorkFlowUserGroupId.MarketMaker;
            orderWorkFlowResponse.Groups = await _applicationDbContext.WorkFlowUserGroups.Where(w => allValidGroups.Contains(w.WorkFlowUserGroupId)).ProjectTo<WorkFlowGroupResponse>(_mapper.ConfigurationProvider).OrderBy(o => o.WorkFlowUserGroupId).ToListAsync();

            var allOrderComments = _applicationDbContext.OrderComments.Include(a => a.WorkFlowUser).Where(w => w.OrderId == request.OrderId).ToList();
            foreach (var item in finalResult)
            {


                if (isPrivateGroup)
                    item.PrivateMessages = allOrderComments.Where(w => w.IsPrivate && w.OrderId == request.OrderId && w.WorkFlowGuidId == item.WorkFlowGuidId).OrderByDescending(o => o.CommentDate)
                        .Select(s => new CommentSummary
                        {
                            Comment = s.Comment,
                            CommentDate = s.CommentDate,
                            MarketUserName = s.WorkFlowUser.FirstName + " " + s.WorkFlowUser.LastName
                        }).ToList();
                item.PublicMessages = allOrderComments.Where(w => !w.IsPrivate && w.OrderId == request.OrderId && w.WorkFlowGuidId == item.WorkFlowGuidId).OrderByDescending(o => o.CommentDate)
                .Select(s => new CommentSummary
                {
                    Comment = s.Comment,
                    CommentDate = s.CommentDate,
                    MarketUserName = s.WorkFlowUser.FirstName + " " + s.WorkFlowUser.LastName
                }).ToList();
            }

            orderWorkFlowResponse.WorkFlowItems = finalResult;

            return orderWorkFlowResponse;
        }
    }


}

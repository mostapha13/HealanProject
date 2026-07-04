using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Extensions;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords
{
    public class UserCardboardRecordByIdQuery : IRequest<List<UserCardboardRecordResponse>>
    {
        public Guid? UserId { get; set; }
        public List<string> OrderIds { get; set; }
    }
    public class UserCardboardRecordByIdQueryHandler : IRequestHandler<UserCardboardRecordByIdQuery, List<UserCardboardRecordResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public UserCardboardRecordByIdQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<List<UserCardboardRecordResponse>> Handle(UserCardboardRecordByIdQuery request, CancellationToken cancellationToken)
        {
            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
                //cuurentUserId = _applicationDbContext.WorkFlowUsers.Where(w=>w.IdentityUserId.HasValue).First().IdentityUserId.Value;
            }


            List<Guid> allOrder = new List<Guid>();
            if (request.OrderIds != null)
                foreach (var item in request.OrderIds)
                {
                    var val = item.ToGuid();
                    if (val.HasValue)
                        allOrder.Add(val.Value);
                }



            var currenUser = await _applicationDbContext.WorkFlowUsers.Where(w => w.IdentityUserId == cuurentUserId).FirstOrDefaultAsync();
            if (currenUser == null)
                return null;

            var query = from wfg in _applicationDbContext.WorkFlowGuides
                        join form in _applicationDbContext.Forms on wfg.FormId equals form.FormId
                        join wf in _applicationDbContext.WorkFlowItems on wfg.WorkFlowGuideId equals wf.WorkFlowGuideId
                        join wft in _applicationDbContext.WorkFlowTypes on wfg.WorkFlowTypeId equals wft.WorkFlowTypeId
                        join order in _applicationDbContext.Orders on wf.OrderId equals order.OrderId

                        join senderGroup in _applicationDbContext.WorkFlowUserGroups on wfg.SenderGroupId equals senderGroup.WorkFlowUserGroupId
                        join receiverGroup in _applicationDbContext.WorkFlowUserGroups on wfg.ReceiverGroupId equals receiverGroup.WorkFlowUserGroupId
                        join formRecord in _applicationDbContext.Forms on wft.RecordFormId equals formRecord.FormId into formRecords
                        from myformRecords in formRecords.DefaultIfEmpty()
                        where
                        //order.OrderStatusId == Domain.Enums.OrderStatusId.Open &&
                       !order.IsDeleted &&
                        (
                        (currenUser.FundId.HasValue && order.FundId == currenUser.FundId) ||
                        (!currenUser.FundId.HasValue)
                        ) &&
                        allOrder.Contains(order.OrderId)

                        orderby wf.WorkFlowDate descending
                        select new UserCardboardRecordResponse
                        {
                            SenderGroupName = senderGroup.GroupName,
                            ReceiverGroupName = receiverGroup.GroupName,
                            WorkFlowDate = wf.WorkFlowDate,
                            WorkFlowTypeName = wft.WorkFlowName,
                            WorkFlowTypeId = wft.WorkFlowTypeId,
                            TrackingNumber = order.TrackingNumber,
                            OrderId = order.OrderId,
                            FormName = myformRecords == null ? form.FormName : myformRecords.FormName,
                            FormUrl = myformRecords == null ? form.FormUrl : myformRecords.FormUrl,
                            HasObserved = wf.HasObserved,
                            ExtraInfo = order.ExtraInfo
                        };

            var result = query.ToList();
            return result;
        }
    }

}

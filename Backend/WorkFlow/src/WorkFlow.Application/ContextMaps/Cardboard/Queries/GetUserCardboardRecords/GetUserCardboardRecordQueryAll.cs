using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Cardboard.Queries.GetUserCardboardRecords
{
    public class GetUserCardboardRecordQueryAll : AbstractRequestBase<List<UserCardboardRecordResponse>>
    {
        public Guid? UserId { get; set; }
        public Guid? FundId { get; set; }
        public string TrackingNumber { get; set; }
        public DateTime? OrderDate { get; set; }
    }
    public class GetUserCardboardRecordQueryAllHandler : IRequestHandler<GetUserCardboardRecordQueryAll, List<UserCardboardRecordResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public GetUserCardboardRecordQueryAllHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<List<UserCardboardRecordResponse>> Handle(GetUserCardboardRecordQueryAll request, CancellationToken cancellationToken)
        {
            var cuurentUserId = request.UserId;
            if (!cuurentUserId.HasValue || cuurentUserId == Guid.Empty)
                cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
                //cuurentUserId = _applicationDbContext.WorkFlowUsers.Where(w=>w.IdentityUserId.HasValue).First().IdentityUserId.Value;
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
                        )
                        &&
                        (
                        (string.IsNullOrEmpty(request.TrackingNumber) || order.TrackingNumber.Contains(request.TrackingNumber)) &&
                         (!request.FundId.HasValue || order.FundId == request.FundId)
                           )
                                   &&
                           (
                           (!request.OrderDate.HasValue ||
                           (wf.WorkFlowDate.Year == request.OrderDate.Value.Year && wf.WorkFlowDate.Month == request.OrderDate.Value.Month && wf.WorkFlowDate.Day == request.OrderDate.Value.Day)
                           )
                           )
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

            var result = await query.ToListAsync(cancellationToken);
            return result;
        }
    }

}

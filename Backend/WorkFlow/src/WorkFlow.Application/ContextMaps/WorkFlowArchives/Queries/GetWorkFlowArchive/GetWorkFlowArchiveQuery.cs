using AutoMapper;
using MediatR;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.WorkFlowArchives.Queries.GetWorkFlowArchive
{
    public class GetWorkFlowArchiveQuery : AbstractSearchRequest<PaginatedList<WorkFlowArchiveResponse>>
    {
        public Guid? OrderId { get; set; }
        public string TrackingNumber { get; set; }
        public Guid? FundId { get; set; }
        public DateTime? OrderDate { get; set; }
    }
    public class GetCardboardQueryHandler : IRequestHandler<GetWorkFlowArchiveQuery, PaginatedList<WorkFlowArchiveResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public GetCardboardQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<PaginatedList<WorkFlowArchiveResponse>> Handle(GetWorkFlowArchiveQuery request, CancellationToken cancellationToken)
        {
            //var cuurentUserId = _currentUserService.UserId;
            //if (cuurentUserId == Guid.Empty)
            //{
            //    throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            //}

            //var currenUser = await _applicationDbContext.WorkFlowUsers.Where(w=>w.IdentityUserId==cuurentUserId).FirstOrDefaultAsync();

            var query = from wfa in _applicationDbContext.WorkFlowArchives
                        join wfg in _applicationDbContext.WorkFlowGuides on wfa.WorkFlowGuidId equals wfg.WorkFlowGuideId
                        join form in _applicationDbContext.Forms on wfg.FormId equals form.FormId
                        join wft in _applicationDbContext.WorkFlowTypes on wfg.WorkFlowTypeId equals wft.WorkFlowTypeId
                        join order in _applicationDbContext.Orders on wfa.OrderId equals order.OrderId
                        join senderGroup in _applicationDbContext.WorkFlowUserGroups on wfg.SenderGroupId equals senderGroup.WorkFlowUserGroupId
                        join receiverGroup in _applicationDbContext.WorkFlowUserGroups on wfg.ReceiverGroupId equals receiverGroup.WorkFlowUserGroupId
                        where
                       //    order.OrderStatusId == Domain.Enums.OrderStatusId.Open &&
                       !order.IsDeleted &&
                        //(
                        //(currenUser.FundId.HasValue && order.FundId == currenUser.FundId) ||
                        //(!currenUser.FundId.HasValue)
                        //)
                        //&&
                        (
                        (string.IsNullOrEmpty(request.TrackingNumber) || order.TrackingNumber.Contains(request.TrackingNumber)) &&
                         (!request.OrderId.HasValue || order.OrderId == request.OrderId) &&
                         (!request.FundId.HasValue || order.FundId == request.FundId) &&
                           (!request.OrderDate.HasValue || wfa.WorkFlowDate == request.OrderDate)
                           )
                        select new WorkFlowArchiveResponse
                        {
                            FormName = form.FormName,
                            SenderGroupName = senderGroup.GroupName,
                            ReceiverGroupName = receiverGroup.GroupName,
                            WorkFlowDate = wfa.WorkFlowDate,
                            WorkFlowName = wft.WorkFlowName,
                            TrackingNumber = order.TrackingNumber,
                            OrderId = order.OrderId,
                            FormUrl = form.FormUrl,
                            ExtraInfo = order.ExtraInfo
                        };

            var result = await query.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
            return result;
        }
    }

}

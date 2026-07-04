using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using WorkFlow.Application.Common.Interfaces;

namespace WorkFlow.Application.ContextMaps.Archives.Queries.GetUserArchives
{
    public class GetUserArchivesQuery : AbstractSearchRequest<PaginatedList<UserArchivesResponse>>
    {
        public Guid? FundId { get; set; }
        public string TrackingNumber { get; set; }
        public DateTime? OrderDate { get; set; }
    }
    public class GetUserArchivesQueryHandler : IRequestHandler<GetUserArchivesQuery, PaginatedList<UserArchivesResponse>>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;

        public GetUserArchivesQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<PaginatedList<UserArchivesResponse>> Handle(GetUserArchivesQuery request, CancellationToken cancellationToken)
        {
            var cuurentUserId = _currentUserService.UserId;
            if (cuurentUserId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("ابتدا وارد سامانه شوید");
            }

            var currenUser = await _applicationDbContext.WorkFlowUsers.Where(w => w.IdentityUserId == cuurentUserId).FirstOrDefaultAsync();

            var query = from wfg in _applicationDbContext.WorkFlowGuides
                        join form in _applicationDbContext.Forms on wfg.FormId equals form.FormId
                        join wfa in _applicationDbContext.WorkFlowArchives on wfg.WorkFlowGuideId equals wfa.WorkFlowGuidId
                        join wft in _applicationDbContext.WorkFlowTypes on wfg.WorkFlowTypeId equals wft.WorkFlowTypeId
                        join order in _applicationDbContext.Orders on wfa.OrderId equals order.OrderId
                        join senderGroup in _applicationDbContext.WorkFlowUserGroups on wfg.SenderGroupId equals senderGroup.WorkFlowUserGroupId
                        join receiverGroup in _applicationDbContext.WorkFlowUserGroups on wfg.ReceiverGroupId equals receiverGroup.WorkFlowUserGroupId
                        where
                        order.OrderStatusId == OrderStatusId.Closed &&
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
                           (wfa.WorkFlowDate.Year == request.OrderDate.Value.Year && wfa.WorkFlowDate.Month == request.OrderDate.Value.Month && wfa.WorkFlowDate.Day == request.OrderDate.Value.Day)
                           )
                           )
                        orderby wfa.WorkFlowDate descending
                        select new UserArchivesResponse
                        {
                            FormName = form.FormName,
                            SenderGroupName = senderGroup.GroupName,
                            ReceiverGroupName = receiverGroup.GroupName,
                            WorkFlowDate = wfa.WorkFlowDate,
                            WorkFlowTypeName = wft.WorkFlowName,
                            WorkFlowTypeId = wft.WorkFlowTypeId,
                            TrackingNumber = order.TrackingNumber,
                            OrderId = order.OrderId,
                            FormUrl = form.FormUrl
                        };

            var result = await query.PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);
            return result;
        }
    }

}

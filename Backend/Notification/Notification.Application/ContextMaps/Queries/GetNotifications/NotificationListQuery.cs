using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Notification.Application.Interface;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Mapping;
using Share.Application.Common.Models;

using Share.Domain.Entities;
using Share.Domain.Extensions;

namespace Notification.Application.ContextMaps.Queries.GetNotifications
{
    public class NotifPaginatedList : PaginatedList<NotificationResponse>
    {
        public NotifPaginatedList(List<NotificationResponse> items, int count, int pageNumber, int pageSize) : base(items, count, pageNumber, pageSize)
        {

        }
        public long NewMessageCount { get; set; }
    }
    public class NotificationListQuery : AbstractSearchRequest<NotifPaginatedList>
    {
        public View_Type View_Type { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class NotificationListQueryHandler : IRequestHandler<NotificationListQuery, NotifPaginatedList>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        public NotificationListQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _currentUserService = currentUserService;
        }
        public async Task<NotifPaginatedList> Handle(NotificationListQuery request, CancellationToken cancellationToken)
        {

            var fromdate = DateTime.Now.AddYears(-50);
            var todate = DateTime.Now.AddYears(50);

            if (request.FromDate.HasValue)
                fromdate = new DateTime(request.FromDate.Value.Year, request.FromDate.Value.Month, request.FromDate.Value.Day);
            if (request.ToDate.HasValue)
                todate = new DateTime(request.ToDate.Value.Year, request.ToDate.Value.Month, request.ToDate.Value.Day);


            var query = from nu in _applicationDbContext.NotificationUsers       
                        join n in _applicationDbContext.NotificationInfos on nu.NotificationInfoId equals n.NotificationInfoId
                        where nu.UserId == _currentUserService.UserId &&
                          n.Notif_Date > fromdate &&
                          n.Notif_Date < todate &&
                         (request.View_Type == View_Type.All ||
                         (request.View_Type == View_Type.Readed && nu.ReadDateTime.HasValue) ||
                         (request.View_Type == View_Type.Unreaded && !nu.ReadDateTime.HasValue))
                        orderby n.Notif_Date descending
                        select n;


            var res = query.ProjectTo<NotificationResponse>(_mapper.ConfigurationProvider);

            var pagedList =await res
                .PaginatedListAsync(request.PageNumber, request.PageSize, cancellationToken);

            var allId = pagedList.Items.Select(s => s.NotificationId).ToList();
            var allViewedId = _applicationDbContext.NotificationUsers
                .Where(w => allId.Contains(w.NotificationInfoId) && w.UserId == _currentUserService.UserId && w.ReadDateTime.HasValue)
                .Select(s=>s.NotificationInfoId)
                .ToList();

             NotifPaginatedList notifPaginatedList = new NotifPaginatedList(pagedList.Items, pagedList.TotalCount, request.PageNumber, request.PageSize);

            foreach (var item in pagedList.Items)
            {
                item.AccessSystemName = item.AccessSystemId.GetDisplayName();
                if (allViewedId.Contains(item.NotificationId))
                    item.Status = View_Type.Readed;
                else
                    item.Status = View_Type.Unreaded;
            }
            notifPaginatedList.NewMessageCount = _applicationDbContext.NotificationUsers.Where(w => w.UserId == _currentUserService.UserId && !w.ReadDateTime.HasValue).Count();

            return notifPaginatedList;
        }
    }
    public enum View_Type
    {
        All,
        Readed,
        Unreaded
    }

}

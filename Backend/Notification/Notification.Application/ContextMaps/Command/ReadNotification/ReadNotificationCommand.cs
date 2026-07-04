using MediatR;
using Notification.Application.Interface;
using Share.Application.Common.Interfaces;
using Share.Domain.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Notification.Application.ContextMaps.Command.ReadNotification
{
    public class ReadNotificationCommand : IRequest<Unit>
    {
        public Guid NotificationId { get; set; }
    }
    public class ReadNotificationCommandHandler : IRequestHandler<ReadNotificationCommand, Unit>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ICurrentUserService _currentUserService;
        public ReadNotificationCommandHandler(IApplicationDbContext applicationDbContext, ICurrentUserService currentUserService)
        {
            _applicationDbContext = applicationDbContext;
            _currentUserService = currentUserService;
        }
        public async Task<Unit> Handle(ReadNotificationCommand request, CancellationToken cancellationToken)
        {
            var notifUsers = _applicationDbContext.NotificationUsers.Where(x => x.NotificationInfoId == request.NotificationId && x.UserId == _currentUserService.UserId && !x.ReadDateTime.HasValue);
            if (notifUsers == null || !notifUsers.Any())
            {
                return Unit.Value;
            }
            foreach (var notifUser in notifUsers)
            notifUser.ReadDateTime = DateTimeHelper.GetCurrentDateTime();
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            return Unit.Value;
        }
    }
}

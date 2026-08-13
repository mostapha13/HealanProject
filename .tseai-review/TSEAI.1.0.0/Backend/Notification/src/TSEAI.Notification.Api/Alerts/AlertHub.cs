using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TSEAI.Notification.Api.Alerts;

[Authorize]
public sealed class AlertHub : Hub;

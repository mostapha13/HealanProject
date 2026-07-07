using AutoMapper;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetForms;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetWorkflowUserByUserId;
using WorkFlow.Share.Services;

namespace Healan.Application.Users.Queries.CurrentUser;

    public class CurrentUserQuery : AbstractRequestBase<CurrentUserResponse>
    {

    }
    public class CurrentUserQueryHandler : IRequestHandler<CurrentUserQuery, CurrentUserResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly IMapper _mapper;
        private readonly IIdentityTool _identityTool;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWorkFlowHttpProvider _workFlowHttpProvider;
        private readonly ILogger<CurrentUserQueryHandler> _logger;

        public CurrentUserQueryHandler(
            IApplicationDbContext applicationDbContext,
            IMapper mapper,
            IIdentityTool identityTool,
            ICurrentUserService currentUserService,
            IWorkFlowHttpProvider workFlowHttpProvider,
            ILogger<CurrentUserQueryHandler> logger)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _identityTool = identityTool;
            _currentUserService = currentUserService;
            _workFlowHttpProvider = workFlowHttpProvider;
            _logger = logger;
        }
        public async Task<CurrentUserResponse> Handle(CurrentUserQuery request, CancellationToken cancellationToken)
        {
            var identityUserId = _currentUserService.UserId;
            if (identityUserId == Guid.Empty)
            {
                _logger.LogWarning("CurrentUser called without authenticated identity (sub claim missing)");
                throw new UnauthorizedAccessException("کاربر احراز هویت نشده است.");
            }

            WorkFlowUserResponse? user = null;
            try
            {
                user = await _workFlowHttpProvider.WorkflowUserByUserId(
                    new GetWorkflowUserByUserIdQuery() { UserId = identityUserId });
            }
            catch (Exception ex)
            {
                // WorkFlow ممکن است در dev اجرا نشود — CurrentUser همچنان پاسخ می‌دهد.
                _logger.LogWarning(ex, "WorkFlow unavailable for CurrentUser");
            }

            var summary = await _identityTool.GetUserSummaryInfo(new IdentityServer.GrpcClient.GetByIdRequest()
            {
                UserId = identityUserId.ToString()
            });

            if (summary == null || string.IsNullOrWhiteSpace(summary.UserId))
            {
                _logger.LogWarning("Identity gRPC GetUserSummaryInfo returned empty for user {UserId}", identityUserId);
            }

            var currentUserResponse = new CurrentUserResponse
            {
                HasConfirmed = true,
                UserSummaryReply = MapUserSummary(summary),
            };

            if (user?.WorkFlowUserGroup != null)
            {
                currentUserResponse.HasAccessToConfirmForm =
                    GetOrderDetailFormByIdHandler.CanConfirmForm(user.WorkFlowUserGroup.WorkFlowUserGroupId);
                currentUserResponse.IsCashMarketBroker =
                    GetOrderDetailFormByIdHandler.IsCashMarketBroker(user.WorkFlowUserGroup.WorkFlowUserGroupId);
            }

            return currentUserResponse;
        }

        private static UserSummaryDto MapUserSummary(IdentityServer.GrpcClient.UserSummaryReply? summary)
        {
            if (summary == null || string.IsNullOrWhiteSpace(summary.UserId))
                return new UserSummaryDto();

            return new UserSummaryDto
            {
                UserId = summary.UserId,
                FirstName = summary.FirstName ?? string.Empty,
                LastName = summary.LastName ?? string.Empty,
                PhoneNumber = summary.PhoneNumber ?? string.Empty,
                UserName = summary.UserName ?? string.Empty,
                DepartmentName = summary.DepartmentName ?? string.Empty,
                RoleInfos = summary.RoleInfos
                    .Select(role => new RoleInfoDto
                    {
                        RoleName = role.RoleName ?? string.Empty,
                        RoleTitle = role.RoleTitle ?? string.Empty,
                    })
                    .ToList(),
            };
        }

    }
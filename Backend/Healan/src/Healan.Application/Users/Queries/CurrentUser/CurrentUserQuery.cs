using AutoMapper;
using Healan.Application.Common.Interfaces;
using Healan.Application.Users.Dtos;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Share.Application.Common.Interfaces;
using Share.Application.Common.Models;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WorkFlow.Application.ContextMaps.Forms.Queries.GetForms;
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
        public CurrentUserQueryHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IIdentityTool identityTool, ICurrentUserService currentUserService, IWorkFlowHttpProvider workFlowHttpProvider)
        {
            _applicationDbContext = applicationDbContext;
            _mapper = mapper;
            _identityTool = identityTool;
            _currentUserService = currentUserService;
            _workFlowHttpProvider = workFlowHttpProvider;
        }
        public async Task<CurrentUserResponse> Handle(CurrentUserQuery request, CancellationToken cancellationToken)
        {
            var identityUserId = _currentUserService.UserId;
            var user =await _workFlowHttpProvider.WorkflowUserByUserId(new GetWorkflowUserByUserIdQuery() {UserId= identityUserId });

            var summary = await _identityTool.GetUserSummaryInfo(new IdentityServer.GrpcClient.GetByIdRequest()
            {
                UserId = identityUserId.ToString()
            });


            CurrentUserResponse currentUserResponse = new CurrentUserResponse();
            currentUserResponse.HasConfirmed = true;// user!=null && user.IsConfirmed;
            currentUserResponse.UserSummaryReply = summary;
            currentUserResponse.HasAccessToConfirmForm = GetOrderDetailFormByIdHandler.CanConfirmForm(user.WorkFlowUserGroup.WorkFlowUserGroupId);
            currentUserResponse.IsCashMarketBroker = GetOrderDetailFormByIdHandler.IsCashMarketBroker(user.WorkFlowUserGroup.WorkFlowUserGroupId);
            if (user!=null && !user.IsConfirmed && user.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker)
            {
            //var marketMakerAccessRequest = _applicationDbContext.MarketMakerAccessRequests.FirstOrDefault(p => p.MarketMakerUserId == user.WorkFlowUserId);
            //    currentUserResponse.HasConfirmed = false;
            //    if (marketMakerAccessRequest != null)
            //    {
            //        currentUserResponse.MarketMakerAccessRequestId = marketMakerAccessRequest.MarketMakerAccessRequestId;
            //        currentUserResponse.MarketMakerAccessRequestStateId = marketMakerAccessRequest.MarketMakerAccessRequestStateId;
            //    }
            }
            return currentUserResponse;

        }

    }
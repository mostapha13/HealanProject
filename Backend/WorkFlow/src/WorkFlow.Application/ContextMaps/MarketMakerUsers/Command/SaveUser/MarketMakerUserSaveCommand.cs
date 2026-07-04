using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Share.Domain.Enums;
using WorkFlow.Application.Common.Constant;
using Microsoft.Extensions.Logging;
using Share.Domain.Constants;
using Share.Application.Common.Interfaces;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;
using Share.Domain.Exceptions;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser
{
    public class WorkFlowUserSaveCommand : IRequest<WorkFlowUserResponse>
    {
        public Guid? WorkFlowUserId { get; set; }
        public Guid? IdentityUserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public WorkFlowGroupResponse WorkFlowUserGroup { get; set; }
        public FundResponse Fund { get; set; }
    }
    public class WorkFlowUserSaveCommandHandler : IRequestHandler<WorkFlowUserSaveCommand, WorkFlowUserResponse>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ILogger<WorkFlowUserSaveCommandHandler> _logger;
        private readonly ISmsApiService _smsService;
        public WorkFlowUserSaveCommandHandler(IApplicationDbContext applicationDbContext, ILogger<WorkFlowUserSaveCommandHandler> logger, ISmsApiService smsService)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
            _smsService = smsService;
        }
        public async Task<WorkFlowUserResponse> Handle(WorkFlowUserSaveCommand request, CancellationToken cancellationToken)
        {
            var WorkFlowUserUser = _applicationDbContext.WorkFlowUsers.FirstOrDefault(x => x.WorkFlowUserId == request.WorkFlowUserId);
            bool isNew = false;
            if (WorkFlowUserUser == null)
            {
                WorkFlowUserUser = new WorkFlowUser();
                _applicationDbContext.WorkFlowUsers.Add(WorkFlowUserUser);
                isNew = true;
            }
            WorkFlowUserUser.FirstName = request.FirstName;
            WorkFlowUserUser.LastName = request.LastName;
            if (request.IdentityUserId.HasValue)
                WorkFlowUserUser.IdentityUserId = request.IdentityUserId;
            WorkFlowUserUser.PhoneNumber = request.PhoneNumber;
            WorkFlowUserUser.FundId = request.Fund != null && request.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker ? request.Fund.FundId : null;
            WorkFlowUserUser.BrokerId =
                 request.Fund != null && request.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker ?
                 _applicationDbContext.Funds.Where(f => f.FundId == request.Fund.FundId).Select(x => x.BrokerId).FirstOrDefault() :
                 null;
            WorkFlowUserUser.IsActive = request.IsActive;
            WorkFlowUserUser.WorkFlowUserGroupId = request.WorkFlowUserGroup.WorkFlowUserGroupId;


            if (request.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker)
                WorkFlowUserUser.IsConfirmed = false;
            else
                WorkFlowUserUser.IsConfirmed = true;

            var roleName = GetRoleName(WorkFlowUserUser.WorkFlowUserGroupId);
            try
            {

                //Random r = new Random();
                //var x = r.Next(0, 100000000);
                //string password = x.ToString("00000000");

                //var saveRequest = new IdentityServer.GrpcClient.SaveRequest()
                //{
                //    UserId = WorkFlowUserUser.IdentityUserId != null ? WorkFlowUserUser.IdentityUserId.Value.ToString() : "",
                //    IsActive = WorkFlowUserUser.IsActive,
                //    DepartmentId = (int)DepartmentId.WorkFlow,
                //    FirstName = WorkFlowUserUser.FirstName,
                //    LastName = WorkFlowUserUser.LastName,
                //    PhoneNumber = WorkFlowUserUser.PhoneNumber,
                //    Password = password

                //};
                //saveRequest.RoleNames.Add(roleName);
                //var userSummary = await _identityTool.SaveUser(saveRequest);
                //if (userSummary == null)
                //    throw new BadRequestExceptions(ValidationMessages.LoginNotCreated);

                //if (isNew)
                //{
                //    var smsModel = new Share.Domain.Models.SMSModelRequest()
                //    {
                //        Message = $"Password: {password}",
                //        PhoneNumbers = new List<string>() { userSummary.PhoneNumber }
                //    };
                //    await _smsService.SendSMS(smsModel);
                //}

                //WorkFlowUserUser.IdentityUserId = userSummary.UserId.ToGuid();

                await _applicationDbContext.SaveChangesAsync(cancellationToken);
                return new WorkFlowUserResponse()
                {
                    WorkFlowUserId = WorkFlowUserUser.WorkFlowUserId,
                    FirstName = WorkFlowUserUser.FirstName,
                    LastName = WorkFlowUserUser.LastName,
                    Fund = request.Fund,
                    PhoneNumber = WorkFlowUserUser.PhoneNumber,
                    IsActive = WorkFlowUserUser.IsActive,
                    WorkFlowUserGroup = request.WorkFlowUserGroup
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Critical Error Raised In WorkFlowUserSaveCommandHandler");
                throw new BadRequestExceptions(ValidationMessages.LoginNotCreated);
            }
        }
        public string GetRoleName(WorkFlowUserGroupId WorkFlowUserGroupId)
        {
            switch (WorkFlowUserGroupId)
            {
                //case WorkFlowUserGroupId.WorkFlow:
                //    return RoleNames.WorkFlowUser;
                //case WorkFlowUserGroupId.Expert:
                //    return RoleNames.WorkFlowExpert;
                //case WorkFlowUserGroupId.OfficeBoss:
                //    return RoleNames.WorkFlowOfficeBoss;
                //case WorkFlowUserGroupId.Manager:
                //    return RoleNames.WorkFlowManager;
                default:
                    return string.Empty;
            }
        }
    }
}

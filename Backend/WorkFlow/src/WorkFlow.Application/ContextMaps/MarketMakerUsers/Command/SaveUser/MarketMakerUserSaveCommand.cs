using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.ContextMaps.Funds.Queries.GetFunds;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Queries.GetUsers;

namespace WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;

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

    public WorkFlowUserSaveCommandHandler(
        IApplicationDbContext applicationDbContext,
        ILogger<WorkFlowUserSaveCommandHandler> logger)
    {
        _applicationDbContext = applicationDbContext;
        _logger = logger;
    }

    public async Task<WorkFlowUserResponse> Handle(WorkFlowUserSaveCommand request, CancellationToken cancellationToken)
    {
        if (request.WorkFlowUserGroup == null)
            throw new BadRequestExceptions("گروه کاربری WorkFlow مشخص نشده است");

        _logger.LogInformation(
            "WorkFlowUserSave started. IdentityUserId={IdentityUserId}, GroupId={GroupId}, Phone={Phone}",
            request.IdentityUserId, request.WorkFlowUserGroup.WorkFlowUserGroupId, request.PhoneNumber);

        await EnsureWorkFlowUserGroupExistsAsync(request.WorkFlowUserGroup.WorkFlowUserGroupId, cancellationToken);

        var workflowUser = await ResolveWorkFlowUserAsync(request, cancellationToken);

        workflowUser.FirstName = request.FirstName;
        workflowUser.LastName = request.LastName;
        if (request.IdentityUserId.HasValue)
            workflowUser.IdentityUserId = request.IdentityUserId;
        workflowUser.PhoneNumber = request.PhoneNumber;
        workflowUser.FundId = request.Fund != null && request.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker
            ? request.Fund.FundId
            : null;
        workflowUser.BrokerId =
            request.Fund != null && request.WorkFlowUserGroup.WorkFlowUserGroupId == WorkFlowUserGroupId.MarketMaker
                ? _applicationDbContext.Funds.Where(f => f.FundId == request.Fund.FundId).Select(x => x.BrokerId).FirstOrDefault()
                : null;
        workflowUser.IsActive = request.IsActive;
        workflowUser.WorkFlowUserGroupId = request.WorkFlowUserGroup.WorkFlowUserGroupId;
        workflowUser.IsConfirmed = request.WorkFlowUserGroup.WorkFlowUserGroupId != WorkFlowUserGroupId.MarketMaker;

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "WorkFlowUserSave succeeded. WorkFlowUserId={WorkFlowUserId}, IdentityUserId={IdentityUserId}",
                workflowUser.WorkFlowUserId, workflowUser.IdentityUserId);

            return new WorkFlowUserResponse
            {
                WorkFlowUserId = workflowUser.WorkFlowUserId,
                FirstName = workflowUser.FirstName,
                LastName = workflowUser.LastName,
                Fund = request.Fund,
                PhoneNumber = workflowUser.PhoneNumber,
                IsActive = workflowUser.IsActive,
                WorkFlowUserGroup = request.WorkFlowUserGroup,
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "WorkFlowUserSave failed. IdentityUserId={IdentityUserId}, GroupId={GroupId}, Phone={Phone}",
                request.IdentityUserId, request.WorkFlowUserGroup.WorkFlowUserGroupId, request.PhoneNumber);

            var detail = ex.InnerException?.Message ?? ex.Message;
            throw new BadRequestExceptions($"خطا در ثبت کاربر WorkFlow: {detail}");
        }
    }

    private async Task EnsureWorkFlowUserGroupExistsAsync(
        WorkFlowUserGroupId groupId,
        CancellationToken cancellationToken)
    {
        if (await _applicationDbContext.WorkFlowUserGroups
                .AnyAsync(g => g.WorkFlowUserGroupId == groupId, cancellationToken))
            return;

        var info = EnumExtensions.GetEnumInfo<WorkFlowUserGroupId>()
            .FirstOrDefault(e => e.Key == (int)groupId);

        _logger.LogWarning("WorkFlowUserGroup {GroupId} missing — creating seed row", groupId);

        _applicationDbContext.WorkFlowUserGroups.Add(new WorkFlowUserGroup
        {
            WorkFlowUserGroupId = groupId,
            GroupName = info?.DisplayName ?? groupId.ToString(),
        });
        await _applicationDbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<WorkFlowUser> ResolveWorkFlowUserAsync(
        WorkFlowUserSaveCommand request,
        CancellationToken cancellationToken)
    {
        WorkFlowUser? user = null;

        if (request.WorkFlowUserId is Guid workflowUserId && workflowUserId != Guid.Empty)
        {
            user = await _applicationDbContext.WorkFlowUsers
                .FirstOrDefaultAsync(x => x.WorkFlowUserId == workflowUserId, cancellationToken);
        }

        if (user == null && request.IdentityUserId is Guid identityUserId && identityUserId != Guid.Empty)
        {
            user = await _applicationDbContext.WorkFlowUsers
                .FirstOrDefaultAsync(x => x.IdentityUserId == identityUserId, cancellationToken);
        }

        if (user != null)
            return user;

        user = new WorkFlowUser();
        _applicationDbContext.WorkFlowUsers.Add(user);
        return user;
    }
}

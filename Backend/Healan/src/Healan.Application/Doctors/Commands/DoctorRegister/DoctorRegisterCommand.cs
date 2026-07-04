using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Const;
using Healan.Application.Common.Interfaces;
using Healan.Application.Doctors.Dtos;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Users.Entities;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;
using WorkFlow.Share.Services;

namespace Healan.Application.Doctors.Commands.DoctorRegister;
public class DoctorRegisterCommand : DoctorRegisterRequest, IRequest<DoctorRegisterResult>
{
}

public class DoctorRegisterCommandHandler : IRequestHandler<DoctorRegisterCommand, DoctorRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<DoctorRegisterCommandHandler> _logger;
    private readonly IIdentityTool _identityTool;
    private readonly IWorkFlowHttpProvider _workFlowHttpProvider;

    public DoctorRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<DoctorRegisterCommandHandler> logger, IIdentityTool identityTool, IWorkFlowHttpProvider workFlowHttpProvider)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
        _identityTool = identityTool;
        _workFlowHttpProvider = workFlowHttpProvider;
    }
    public async Task<DoctorRegisterResult> Handle(DoctorRegisterCommand request, CancellationToken cancellationToken)
    {

        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        await _applicationDbContext.BeginTransactionAsync();
        var user = _applicationDbContext.Users
               .Include(a => a.Attachment).FirstOrDefault(x => x.IdentityUserId == request.IdentityUserId);

        if (user == null)
        {
            user = new User();
            _applicationDbContext.Users.Add(user);
            isNew = true;
        }

        Random r = new Random();
        var x = r.Next(0, 100000000);
        string password = x.ToString("00000000");
        if (!isNew)
            password = string.Empty;
        var saveRequest = new IdentityServer.GrpcClient.SaveRequest()
        {
            UserId = request != null && request.IdentityUserId != null ? request.IdentityUserId.Value.ToString() : user.IdentityUserId.ToString(),
            IsActive = true,
            DepartmentId = (int)DepartmentId.Doctor,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Mobile,
            Password = password

        };
        var roleRequest = new IdentityServer.GrpcClient.SetUserSystemRoleRequest();
        var identityUser = await _identityTool.SaveUser(saveRequest);

        saveRequest.RoleNames.Add(ListingRoles.PublicUser);
        roleRequest.UserId = identityUser.UserId;
        roleRequest.RoleNames.Add(ListingRoles.PublicUser);
        roleRequest.AccessSystemId = 1;

        var userSummary = await _identityTool.SetUserSystemRole(roleRequest);
        if (userSummary == null)
            throw new BadRequestExceptions("خطا در ثبت کاربر ");


        user.IdentityUserId = userSummary.UserId.ToGuid().Value;
        user.FirstName = request.FirstName;
        user.LastName = userSummary.LastName;
        user.PhoneNumber = userSummary.PhoneNumber;
        user.IsActive = true;



        #region Save Into Workflow
        await _workFlowHttpProvider.Save(new WorkFlowUserSaveCommand()
        {
            IdentityUserId = userSummary.UserId.ToGuid(),
            IsActive = saveRequest.IsActive,
            FirstName = saveRequest.FirstName,
            LastName = saveRequest.LastName,
            PhoneNumber = saveRequest.PhoneNumber,
            WorkFlowUserGroup = new WorkFlowGroupResponse()
            {
                WorkFlowUserGroupId = WorkFlowUserGroupId.Doctor,
            },
        });
        #endregion

        await _applicationDbContext.SaveChangesAsync(cancellationToken);



        var doctor = await _applicationDbContext.Doctors
             .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId);
        if (doctor == null)
        {
            doctor = new Doctor();
            _applicationDbContext.Doctors.Add(doctor);
            isNew = true;
        }

        #region دکتر
        doctor.UserId = user.UserId;
        doctor.CompanyId = request.CompanyId;
        doctor.FirstName = request.FirstName;
        doctor.LastName = request.LastName;
        doctor.NationalCode = request.NationalCode;
        doctor.PersonnelNumber = request.PersonnelNumber;
        doctor.Mobile = request.Mobile;
        doctor.Birthdate = request.Birthdate;
        doctor.MedicalGroupTypeId = request.MedicalGroupTypeId;
        doctor.MedicalSystemNumber = request.MedicalSystemNumber;

        #endregion

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            await _applicationDbContext.CommitTransactionAsync();
        }
        catch (Exception ex)
        {
            await _applicationDbContext.RollbackTransactionAsync();
            _logger.LogError($"Reagister Doctor Exception: {ex.Message}");
            throw new BadRequestExceptions();
        }

        return new DoctorRegisterResult(Id: doctor.DoctorId);
    }
}

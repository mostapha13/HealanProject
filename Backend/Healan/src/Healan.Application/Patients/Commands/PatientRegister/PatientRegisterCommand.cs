using AutoMapper;
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Common.Const;
using Healan.Application.Common.Interfaces;
using Healan.Application.Patients.Dtos;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Insurances.Enums;
using Healan.Domain.Patients.Entities;
using Healan.Domain.Users.Entities;
using Healan.Domain.Users.Enums;
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

namespace Healan.Application.Patients.Commands.PatientRegister;
public class PatientRegisterCommand : PatientRegisterRequest, IRequest<PatientRegisterResult>
{
}

public class PatientRegisterCommandHandler : IRequestHandler<PatientRegisterCommand, PatientRegisterResult>
{
    private readonly IApplicationDbContext _applicationDbContext;
    private readonly IMapper _mapper;
    private readonly IFileManagerTool _FileManagerTool;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<PatientRegisterCommandHandler> _logger;
    private readonly IIdentityTool _identityTool;
    private readonly IWorkFlowHttpProvider _workFlowHttpProvider;

    public PatientRegisterCommandHandler(IApplicationDbContext applicationDbContext, IMapper mapper, IFileManagerTool fileManagerTool, ICurrentUserService currentUserService, ILogger<PatientRegisterCommandHandler> logger, IIdentityTool identityTool, IWorkFlowHttpProvider workFlowHttpProvider)
    {
        _applicationDbContext = applicationDbContext;
        _mapper = mapper;
        _FileManagerTool = fileManagerTool;
        _currentUserService = currentUserService;
        _logger = logger;
        _identityTool = identityTool;
        _workFlowHttpProvider = workFlowHttpProvider;
    }
    public async Task<PatientRegisterResult> Handle(PatientRegisterCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));
        var userId = _currentUserService.UserId;
        bool isNew = false;

        await _applicationDbContext.BeginTransactionAsync();
        var user = _applicationDbContext.Users
               .Include(a => a.Attachment).FirstOrDefault(x => x.UserId == request.UserId);

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
            UserId = request != null && request.UserId != null ? request.UserId.Value.ToString() : user.IdentityUserId.ToString(),
            IsActive = true,
            DepartmentId = (int)DepartmentId.Public,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
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


        await _applicationDbContext.SaveChangesAsync(cancellationToken);


        var Patient = await _applicationDbContext.Patients
             .FirstOrDefaultAsync(x => x.PatientId == request.PatientId);
        if (Patient == null)
        {
            Patient = new Patient();
            _applicationDbContext.Patients.Add(Patient);
            isNew = true;
        }

        #region بیمار
        Patient.UserId = user.UserId;
        Patient.FirstName = request.FirstName;
        Patient.LastName = request.LastName;
        Patient.NationalCode = request.NationalCode;
        Patient.PhoneNumber = request.PhoneNumber;
        Patient.Birthdate = request.Birthdate;
        #endregion


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
                WorkFlowUserGroupId = WorkFlowUserGroupId.Patient,
            },
        });
        #endregion

        await _applicationDbContext.SaveChangesAsync(cancellationToken);

        //#region بیمه
        //var insurance = await _applicationDbContext.Insurances.FirstOrDefaultAsync(x => x.PatientId == Patient.PatientId);
        //if (insurance == null)
        //    insurance = new Insurance();

        //var currentInsurences = Patient?.PatientInsurances?.Where(i => !i.IsDeleted).ToList();
        //var currentInsuranceTypeIds = currentInsurences?.Select(i => (long)i.InsuranceTypeId).ToList();

        //var toAdd = request?.Insurances?.Except(currentInsuranceTypeIds).ToList();
        //var toDelete = currentInsuranceTypeIds.Except(request?.Insurances).ToList();

        //foreach (var item in toAdd)
        //{
        //    Patient?.PatientInsurances.Add(new PatientInsurance
        //    {
        //        InsuranceTypeId = (InsuranceTypeId)item,
        //        PatientId = Patient.PatientId,
        //        IsDeleted = false,
        //    });
        //}

        //foreach (var item in toDelete)
        //{
        //    var deleteInsurance = currentInsurences?.First(i => (long)i.InsuranceTypeId == item);
        //    deleteInsurance.IsDeleted = true;
        //}

        //#endregion
        //#region خدمات اارائه شده به بیمار
        //foreach (var service in request.ServiceTypes)
        //{

        //}
        //#endregion


        //#region Payment

        //#endregion

        try
        {
            await _applicationDbContext.SaveChangesAsync(cancellationToken);
            await _applicationDbContext.CommitTransactionAsync();
            return new PatientRegisterResult(Id: Patient.PatientId);
        }
        catch (Exception ex)
        {
            await _applicationDbContext.RollbackTransactionAsync();
            _logger.LogError($"PatientRegisterCommandHandler exception is: {ex.Message}");
            throw;
        }

    }
}

using AutoMapper;

using FileManager.GrpcClient.Interfaces;

using Healan.Application.Common.Const;

using Healan.Application.Common.Interfaces;

using Healan.Application.Patients.Dtos;

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

using Share.Domain.Models.UserAccessModels;

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

    private readonly IFileManagerTool _fileManagerTool;

    private readonly ILogger<PatientRegisterCommandHandler> _logger;

    private readonly IIdentityTool _identityTool;

    private readonly IWorkFlowHttpProvider _workFlowHttpProvider;



    public PatientRegisterCommandHandler(

        IApplicationDbContext applicationDbContext,

        IMapper mapper,

        IFileManagerTool fileManagerTool,

        ILogger<PatientRegisterCommandHandler> logger,

        IIdentityTool identityTool,

        IWorkFlowHttpProvider workFlowHttpProvider)

    {

        _applicationDbContext = applicationDbContext;

        _mapper = mapper;

        _fileManagerTool = fileManagerTool;

        _logger = logger;

        _identityTool = identityTool;

        _workFlowHttpProvider = workFlowHttpProvider;

    }



    public async Task<PatientRegisterResult> Handle(PatientRegisterCommand request, CancellationToken cancellationToken)

    {

        if (request == null)

            throw new ArgumentNullException(nameof(request));



        _logger.LogInformation(

            "PatientRegister started. PatientId={PatientId}, UserId={UserId}, NationalCode={NationalCode}, Phone={Phone}",

            request.PatientId, request.UserId, request.NationalCode, request.PhoneNumber);



        await _applicationDbContext.BeginTransactionAsync();



        try

        {

            var user = await ResolveHealanUserAsync(request, cancellationToken);

            var isNewUser = user.UserId <= 0;



            _logger.LogInformation("Step 1/5: Identity SaveUser. IsNewUser={IsNewUser}, IdentityUserId={IdentityUserId}",

                isNewUser, user.IdentityUserId);



            var password = isNewUser ? PatientIdentityDefaults.InitialPassword : string.Empty;

            var identityUser = await _identityTool.SaveUser(new IdentityServer.GrpcClient.SaveRequest

            {

                UserId = user.IdentityUserId?.ToString() ?? string.Empty,

                IsActive = true,

                DepartmentId = (int)DepartmentId.Public,

                FirstName = request.FirstName,

                LastName = request.LastName,

                PhoneNumber = request.PhoneNumber,

                Password = password,

            });



            if (identityUser == null || string.IsNullOrWhiteSpace(identityUser.UserId))

            {

                _logger.LogError("Identity SaveUser returned empty for phone {Phone}", request.PhoneNumber);

                throw new BadRequestExceptions(

                    "خطا در ثبت کاربر در Identity Server. موبایل تکراری است یا سرویس Identity در دسترس نیست.");

            }



            _logger.LogInformation("Step 2/5: Identity SetUserSystemRole. IdentityUserId={IdentityUserId}",

                identityUser.UserId);



            var roleRequest = new IdentityServer.GrpcClient.SetUserSystemRoleRequest

            {

                UserId = identityUser.UserId,

                AccessSystemId = (int)AccessSystemId.Healan,

            };

            roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Healan));

            roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Patient));



            var userSummary = await _identityTool.SetUserSystemRole(roleRequest);

            if (userSummary == null || string.IsNullOrWhiteSpace(userSummary.UserId))

            {

                _logger.LogError("Identity SetUserSystemRole returned empty for user {UserId}", identityUser.UserId);

                throw new BadRequestExceptions("خطا در تخصیص نقش بیمار در Identity Server");

            }



            var identityGuid = userSummary.UserId.ToGuid()

                ?? throw new BadRequestExceptions("شناسه کاربر Identity نامعتبر است");



            user.IdentityUserId = identityGuid;

            user.FirstName = request.FirstName;

            user.LastName = string.IsNullOrWhiteSpace(userSummary.LastName) ? request.LastName : userSummary.LastName;

            user.PhoneNumber = string.IsNullOrWhiteSpace(userSummary.PhoneNumber) ? request.PhoneNumber : userSummary.PhoneNumber;

            user.IsActive = true;

            user.UserTypeId = UserTypeId.Patient;



            _logger.LogInformation("Step 3/5: Save Healan user to database");

            await _applicationDbContext.SaveChangesAsync(cancellationToken);



            var patient = await ResolvePatientAsync(request, cancellationToken);

            patient.UserId = user.UserId;

            patient.FirstName = request.FirstName;

            patient.LastName = request.LastName;

            patient.NationalCode = request.NationalCode;

            patient.PhoneNumber = request.PhoneNumber;

            patient.Birthdate = request.Birthdate;



            _logger.LogInformation("Step 4/5: WorkFlow Save. IdentityUserId={IdentityUserId}", identityGuid);

            await SaveWorkflowUserAsync(userSummary, saveRequest: new IdentityServer.GrpcClient.SaveRequest

            {

                IsActive = true,

                FirstName = request.FirstName,

                LastName = request.LastName,

                PhoneNumber = request.PhoneNumber,

            });



            _logger.LogInformation("Step 5/5: Save patient and commit transaction");

            await _applicationDbContext.SaveChangesAsync(cancellationToken);

            await _applicationDbContext.CommitTransactionAsync();



            _logger.LogInformation("PatientRegister succeeded. PatientId={PatientId}, UserId={UserId}, IdentityUserId={IdentityUserId}",

                patient.PatientId, user.UserId, identityGuid);



            return new PatientRegisterResult(
                Id: patient.PatientId,
                LoginUserName: request.PhoneNumber,
                InitialPassword: isNewUser ? PatientIdentityDefaults.InitialPassword : null);

        }

        catch (BadRequestExceptions)

        {

            await SafeRollbackAsync();

            throw;

        }

        catch (Exception ex)

        {

            await SafeRollbackAsync();

            _logger.LogError(ex,

                "PatientRegister failed. NationalCode={NationalCode}, Phone={Phone}, ExceptionType={ExceptionType}, Message={Message}",

                request.NationalCode, request.PhoneNumber, ex.GetType().Name, ex.Message);

            throw MapToClientException(ex);

        }

    }



    private async Task<User> ResolveHealanUserAsync(PatientRegisterCommand request, CancellationToken cancellationToken)

    {

        User? user = null;

        if (request.UserId is > 0)

        {

            user = await _applicationDbContext.Users

                .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        }



        if (user != null)

            return user;



        user = new User();

        _applicationDbContext.Users.Add(user);

        return user;

    }



    private async Task<Patient> ResolvePatientAsync(PatientRegisterCommand request, CancellationToken cancellationToken)

    {

        Patient? patient = null;

        if (request.PatientId is > 0)

        {

            patient = await _applicationDbContext.Patients

                .FirstOrDefaultAsync(x => x.PatientId == request.PatientId, cancellationToken);

        }



        if (patient != null)

            return patient;



        patient = new Patient();

        _applicationDbContext.Patients.Add(patient);

        return patient;

    }



    private async Task SaveWorkflowUserAsync(

        IdentityServer.GrpcClient.UserSummaryReply userSummary,

        IdentityServer.GrpcClient.SaveRequest saveRequest)

    {

        try

        {

            await _workFlowHttpProvider.Save(new WorkFlowUserSaveCommand

            {

                IdentityUserId = userSummary.UserId.ToGuid(),

                IsActive = saveRequest.IsActive,

                FirstName = saveRequest.FirstName,

                LastName = saveRequest.LastName,

                PhoneNumber = saveRequest.PhoneNumber,

                WorkFlowUserGroup = new WorkFlowGroupResponse

                {

                    WorkFlowUserGroupId = WorkFlowUserGroupId.Patient,

                },

            });

        }

        catch (Exception ex)

        {

            _logger.LogWarning(ex, "WorkFlow unavailable during patient registration (non-fatal)");

        }

    }



    private async Task SafeRollbackAsync()

    {

        try

        {

            await _applicationDbContext.RollbackTransactionAsync();

        }

        catch (Exception rollbackEx)

        {

            _logger.LogWarning(rollbackEx, "Rollback failed after patient registration error");

        }

    }



    private static Exception MapToClientException(Exception ex)

    {

        if (ex is DbUpdateException dbEx)

        {

            var detail = dbEx.InnerException?.Message ?? dbEx.Message;

            if (detail.Contains("IX_Patients_NationalCode", StringComparison.OrdinalIgnoreCase) ||

                detail.Contains("NationalCode", StringComparison.OrdinalIgnoreCase))

            {

                return new BadRequestExceptions("بیماری با این کد ملی قبلاً ثبت شده است");

            }



            if (detail.Contains("IX_Doctors_NationalCode", StringComparison.OrdinalIgnoreCase))

            {

                return new BadRequestExceptions("رکورد تکراری در پایگاه داده");

            }



            return new BadRequestExceptions($"خطا در ذخیره بیمار: {detail}");

        }



        if (ex.GetType().FullName == "Grpc.Core.RpcException")

        {

            return new BadRequestExceptions($"خطا در ارتباط با Identity Server: {ex.Message}");

        }



        return new BadRequestExceptions($"خطا در ثبت بیمار: {ex.Message}");

    }

}



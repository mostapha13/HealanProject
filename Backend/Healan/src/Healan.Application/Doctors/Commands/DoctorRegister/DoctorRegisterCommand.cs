using AutoMapper;

using FileManager.GrpcClient.Interfaces;

using Healan.Application.Common.Const;

using Healan.Application.Common.Helpers;

using Healan.Application.Common.Interfaces;

using Healan.Application.Doctors.Dtos;

using Healan.Domain.Doctors.Entities;

using Healan.Domain.Users.Entities;

using IdentityServer.GrpcClient.Interfaces;

using MediatR;

using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Logging;

using Share.Application.Common.Interfaces;

using Share.Domain.Enums;

using Share.Domain.Models.UserAccessModels;

using Share.Domain.Exceptions;

using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;

using WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;

using WorkFlow.Share.Services;
using Share.Domain.Extensions;



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



        await _applicationDbContext.BeginTransactionAsync();



        User? user = null;

        if (request.DoctorId is > 0)

        {

            user = await _applicationDbContext.Doctors

                .Where(d => d.DoctorId == request.DoctorId)

                .Select(d => d.User)

                .FirstOrDefaultAsync(cancellationToken);

        }



        if (user == null && request.IdentityUserId.HasValue)

        {

            user = await _applicationDbContext.Users

                .Include(a => a.Attachment)

                .FirstOrDefaultAsync(x => x.IdentityUserId == request.IdentityUserId, cancellationToken);

        }



        var isNewUser = user == null;

        if (isNewUser)

        {

            user = new User();

            _applicationDbContext.Users.Add(user);

        }



        var password = isNewUser
            ? IdentityPasswordGenerator.Generate()
            : string.Empty;



        var saveRequest = new IdentityServer.GrpcClient.SaveRequest

        {

            UserId = request.IdentityUserId?.ToString() ?? user!.IdentityUserId.ToString(),

            IsActive = true,

            DepartmentId = (int)DepartmentId.Doctor,

            FirstName = request.FirstName,

            LastName = request.LastName,

            PhoneNumber = request.Mobile,

            Password = password,

        };



        var identityUser = await _identityTool.SaveUser(saveRequest);

        if (identityUser == null || string.IsNullOrWhiteSpace(identityUser.UserId))

            throw new BadRequestExceptions("خطا در ثبت کاربر در Identity Server");



        var roleRequest = new IdentityServer.GrpcClient.SetUserSystemRoleRequest

        {

            UserId = identityUser.UserId,

            AccessSystemId = (int)AccessSystemId.Healan,

        };

        roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Healan));

        roleRequest.RoleNames.Add(nameof(UserAccesRoleId.Doctor));



        var userSummary = await _identityTool.SetUserSystemRole(roleRequest);

        if (userSummary == null)

            throw new BadRequestExceptions("خطا در تخصیص نقش پزشک");



        user!.IdentityUserId = userSummary.UserId.ToGuid()

            ?? throw new BadRequestExceptions("شناسه کاربر Identity نامعتبر است");

        user.FirstName = request.FirstName;

        user.LastName = userSummary.LastName;

        user.PhoneNumber = userSummary.PhoneNumber;

        user.IsActive = true;



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

                    WorkFlowUserGroupId = WorkFlowUserGroupId.Doctor,

                },

            });

        }

        catch (Exception ex)

        {

            _logger.LogWarning(ex, "WorkFlow unavailable during doctor registration");

        }



        await _applicationDbContext.SaveChangesAsync(cancellationToken);



        var doctor = request.DoctorId is > 0

            ? await _applicationDbContext.Doctors

                .FirstOrDefaultAsync(x => x.DoctorId == request.DoctorId, cancellationToken)

            : null;



        if (doctor == null)

        {

            doctor = new Doctor();

            _applicationDbContext.Doctors.Add(doctor);

        }



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



        try

        {

            await _applicationDbContext.SaveChangesAsync(cancellationToken);

            await _applicationDbContext.CommitTransactionAsync();

        }

        catch (DbUpdateException ex)

        {

            await _applicationDbContext.RollbackTransactionAsync();

            _logger.LogError(ex, "Doctor register failed for national code {NationalCode}", request.NationalCode);



            var inner = ex.InnerException?.Message ?? ex.Message;

            if (inner.Contains("NationalCode", StringComparison.OrdinalIgnoreCase)

                || inner.Contains("IX_Doctors_NationalCode", StringComparison.OrdinalIgnoreCase))

                throw new BadRequestExceptions("پزشکی با این کد ملی قبلاً ثبت شده است");



            if (inner.Contains("CompanyId", StringComparison.OrdinalIgnoreCase)

                || inner.Contains("FK_Doctors_Companies", StringComparison.OrdinalIgnoreCase))

                throw new BadRequestExceptions("مرکز درمانی انتخاب‌شده معتبر نیست");



            throw new BadRequestExceptions($"خطا در ذخیره اطلاعات پزشک: {inner}");

        }

        catch (Exception ex)

        {

            await _applicationDbContext.RollbackTransactionAsync();

            _logger.LogError(ex, "Doctor register failed");

            throw new BadRequestExceptions($"خطا در ثبت پزشک: {ex.Message}");

        }



        return new DoctorRegisterResult(Id: doctor.DoctorId);

    }

}



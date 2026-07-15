
using FileManager.GrpcClient.Interfaces;
using Healan.Application.Attachments.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Application.Common.Helpers;
using Healan.Application.Users.Dtos;
using Healan.Domain.Attachments.Entities;
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
using System.ComponentModel.DataAnnotations;
using WorkFlow.Application.ContextMaps.MarketMakerUserGroups.Queries.GetGroups;
using WorkFlow.Application.ContextMaps.MarketMakerUsers.Command.SaveUser;
using WorkFlow.Share.Services;

namespace Healan.Application.Users.Commands.SaveUser
{
    public class UserSaveCommand : IRequest<UserResult>
    {

        public long? UserId { get; set; }
        [Display(Name = "نام کاربری")]
        public Guid? IdentityUserId { get; set; }

        [Display(Name = "نام")]
        public string FirstName { get; set; }

        [Display(Name = "نام خانوادگی")]
        public string LastName { get; set; }

        [Display(Name = "شماره تلفن همراه / نام کاربری")]
        public string PhoneNumber { get; set; }

        [Display(Name = "فعال/غیرفعال")]
        public bool IsActive { get; set; }

        [Display(Name = "کد تلفن ثابت")]
        public string? PrefixNumber { get; set; }
        [Display(Name = "شماره تلفن ثابت")]
        public string? Landline { get; set; }

        [Display(Name = "نام شرکت یا نهاد")]
        public long? CompanyId { get; set; }

        [Display(Name = "شماره پرسنلی")]
        public string? PersonnelNumber { get; set; }

        [Display(Name = "نقش سازمانی")]
        public List<UserRole> UserRoles { get; set; }

        [Display(Name = "شماره داخلی")]
        public string? ExtensionCompanyPhoneNumber { get; set; }

        [Display(Name = "تصویر")]
        public AttachmentDto? Attachment { get; set; }
        public UserTypeId UserTypeId { get; set; }

    }
    public class UserSaveCommandHandler : IRequestHandler<UserSaveCommand, UserResult>
    {
        private readonly IApplicationDbContext _applicationDbContext;
        private readonly ILogger<UserSaveCommandHandler> _logger;
        private readonly IIdentityTool _identityTool;
        private readonly ICurrentUserService _currentUserService;
        private readonly IFileManagerTool _FileManagerTool;
        private readonly IWorkFlowHttpProvider _workFlowHttpProvider;

        public UserSaveCommandHandler(IApplicationDbContext applicationDbContext, ILogger<UserSaveCommandHandler> logger, IIdentityTool identityTool, ICurrentUserService currentUserService, IFileManagerTool fileManagerTool, IWorkFlowHttpProvider workFlowHttpProvider)
        {
            _applicationDbContext = applicationDbContext;
            _logger = logger;
            _identityTool = identityTool;
            _currentUserService = currentUserService;
            _FileManagerTool = fileManagerTool;
            _workFlowHttpProvider = workFlowHttpProvider;
        }
        public async Task<UserResult> Handle(UserSaveCommand request, CancellationToken cancellationToken)
        {
            var allRole = await _identityTool.GetAllRole(new IdentityServer.GrpcClient.Empty());
            var roleNames = allRole.RoleInfos_.Select(s => s.RoleName).ToList();
            foreach (var item in request.UserRoles)
            {
                if (!roleNames.Contains(item.Name))
                {
                    throw new BadRequestExceptions("نقش کاربر معتبر نیست.");
                }
            }

            var user = _applicationDbContext.Users
                .Include(a => a.Attachment).FirstOrDefault(x => x.UserId == request.UserId);
            bool isNew = false;
            if (user == null)
            {
                user = new User();
                _applicationDbContext.Users.Add(user);
                isNew = true;
            }



            string password = isNew ? IdentityPasswordGenerator.Generate() : string.Empty;
            var saveRequest = new IdentityServer.GrpcClient.SaveRequest()
            {
                UserId = request != null && request.IdentityUserId != null ? request.IdentityUserId.Value.ToString() : user.IdentityUserId.ToString(),
                IsActive = request.IsActive,
                DepartmentId = (int)DepartmentId.PublicRelations,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Password = password

            };
            foreach (var role in request.UserRoles)
                saveRequest.RoleNames.Add(role.Name);
            var userSummary = await _identityTool.SaveUser(saveRequest);
            if (userSummary == null)
                throw new BadRequestExceptions("خطا در ثبت کاربر ");



            user.IdentityUserId = userSummary.UserId.ToGuid().Value;
            user.FirstName = request.FirstName;
            user.LastName = userSummary.LastName;
            user.PhoneNumber = userSummary.PhoneNumber;
            user.PrefixNumber = request.PrefixNumber;
            user.CompanyId = request.CompanyId;
            if (user.CompanyId is null or <= 0)
            {
                var defaultCompanyId = await _applicationDbContext.Companies
                    .AsNoTracking()
                    .OrderBy(c => c.CompanyId)
                    .Select(c => (long?)c.CompanyId)
                    .FirstOrDefaultAsync(cancellationToken);
                if (defaultCompanyId is > 0)
                    user.CompanyId = defaultCompanyId;
            }
            user.Landline = request.Landline;
            user.PersonnelNumber = request.PersonnelNumber;
            user.ExtensionCompanyPhoneNumber = request.ExtensionCompanyPhoneNumber;
            user.IsActive = request.IsActive;
            user.UserTypeId = request.UserTypeId;

            #region LogoFileId

            if (request.Attachment != null)
            {
                if (user.AttachmentId != null && user.AttachmentId != request.Attachment.FileId)
                    user.Attachment.IsDeleted = true;

                if (user.AttachmentId != request.Attachment.FileId)
                {
                    var fileInfo = await _FileManagerTool.GetFileReplyInfo(request.Attachment.FileId);
                    user.Attachment = new Attachment
                    {
                        Link = fileInfo.Link,
                        FileId = request.Attachment.FileId,
                        FileName = fileInfo.FileName,
                        FileType = fileInfo.FileType,
                        Title = $"{request.FirstName} {request.LastName}"
                    };

                    _applicationDbContext.Attachments.Add(user.Attachment);
                }

            }
            else if (user.Attachment != null)
                user.Attachment.IsDeleted = true;

            #endregion


            #region Save Into Workflow
            try
            {
                await _workFlowHttpProvider.Save(new WorkFlowUserSaveCommand()
                {
                    IdentityUserId = userSummary.UserId.ToGuid(),
                    IsActive = saveRequest.IsActive,
                    FirstName = saveRequest.FirstName,
                    LastName = saveRequest.LastName,
                    PhoneNumber = saveRequest.PhoneNumber,
                    WorkFlowUserGroup = new WorkFlowGroupResponse()
                    {
                        WorkFlowUserGroupId = WorkFlowUserGroupId.Healan,
                    },
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "WorkFlow unavailable during user registration");
            }
            #endregion

            await _applicationDbContext.SaveChangesAsync(cancellationToken);

            return new UserResult()
            {
                UserId = user.UserId,
            };

        }
    }
}

using Grpc.Core;
using IdentityServer.Domain;
using IdentityServer.Domain.Data;
using IdentityServer.Domain.Entities;
using IdentityServer.GrpcClient;
using IdentityServer.GrpcServer.CachedModel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Cache;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityServer.GrpcServer.Services
{
    public class IdentityService : UserService.UserServiceBase
    {
        private readonly ILogger<IdentityService> _logger;
        private readonly ApplicationDbContext _applicationDbContext;
        private readonly ICacheManager<UserSummaryReplyCached> _cacheManager;
        private readonly UserManager<ApplicationUser> _userManager;
        public IdentityService(ILogger<IdentityService> logger, ApplicationDbContext applicationDbContext, ICacheManager<UserSummaryReplyCached> cacheManager, UserManager<ApplicationUser> userManager)
        {
            _logger = logger;
            _applicationDbContext = applicationDbContext;
            _cacheManager = cacheManager;
            _userManager = userManager;
        }

        public override async Task<UserSummaryReply> GetById(GetByIdRequest request, ServerCallContext context)
        {
            if (request == null)
                _logger.LogError("Request Is Null!!!");

            if (request != null)
                _logger.LogError(request.UserId + " !!! ");

            var userId = request.UserId.ToGuid();
            if (!userId.HasValue)
                return new UserSummaryReply();

            var UserSummaryReplyCached = new UserSummaryReplyCached(userId.Value);

            var user = _applicationDbContext.Users.FirstOrDefault(p => p.Id == userId.Value);
            if (user == null)
                return new UserSummaryReply();
            var result = await GetUserSummaryReply(user.Id);

            return result;
        }
        public override async Task<UserSummaryReply> SaveUser(SaveRequest request, ServerCallContext context)
        {
            var userId = request.UserId.ToGuid();
            if (!userId.HasValue || userId.Value == Guid.Empty)
            {
                var oldUser = _applicationDbContext.Users.FirstOrDefault(p =>
                    p.UserName == request.PhoneNumber || p.PhoneNumber == request.PhoneNumber);
                if (oldUser != null)
                    userId = oldUser.Id;
            }

            var user = userId.HasValue && userId.Value != Guid.Empty
                ? _applicationDbContext.Users.FirstOrDefault(p => p.Id == userId.Value)
                : null;

            // Phone fallback if id was wrong / stale
            if (user == null && !string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                user = _applicationDbContext.Users.FirstOrDefault(p =>
                    p.UserName == request.PhoneNumber || p.PhoneNumber == request.PhoneNumber);
            }

            if (user == null)
            {
                user = new ApplicationUser();
                user.PasswordHash = _userManager.PasswordHasher.HashPassword(user, request.Password);
                user.DepartmentId = Share.Domain.Enums.DepartmentId.MarketMaker;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.IsActive = request.IsActive;
                user.PhoneNumber = request.PhoneNumber;
                user.PhoneNumberConfirmed = true;
                user.UserName = request.PhoneNumber;
                user.NormalizedUserName = request.PhoneNumber;
                var createResult = await _userManager.CreateAsync(user, request.Password);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    _logger.LogError("Identity SaveUser CreateAsync failed for {Phone}: {Errors}", request.PhoneNumber, errors);
                    return new UserSummaryReply();
                }
            }
            else
            {
                user.DepartmentId = Share.Domain.Enums.DepartmentId.MarketMaker;
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;
                user.IsActive = request.IsActive;
                user.PhoneNumber = request.PhoneNumber;
                user.PhoneNumberConfirmed = true;
                user.UserName = request.PhoneNumber;
                user.NormalizedUserName = request.PhoneNumber;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
                    _logger.LogError("Identity SaveUser UpdateAsync failed for {Phone}: {Errors}", request.PhoneNumber, errors);
                    return new UserSummaryReply();
                }
            }

            // Persist AspNetUsers.TwoFactorEnabled explicitly (UpdateAsync alone is unreliable here).
            var twoFactorResult = await _userManager.SetTwoFactorEnabledAsync(user, request.TwoFactorEnabled);
            if (!twoFactorResult.Succeeded)
            {
                var errors = string.Join("; ", twoFactorResult.Errors.Select(e => e.Description));
                _logger.LogError(
                    "Identity SaveUser SetTwoFactorEnabledAsync({Enabled}) failed for {Phone}: {Errors}",
                    request.TwoFactorEnabled,
                    request.PhoneNumber,
                    errors);
            }
            else
            {
                _logger.LogInformation(
                    "Identity SaveUser set TwoFactorEnabled={Enabled} for user {UserId} phone={Phone}",
                    request.TwoFactorEnabled,
                    user.Id,
                    request.PhoneNumber);
            }

            await UpdateUserRoles(user.Id, request.RoleNames != null ? request.RoleNames.ToList() : new List<string>());

            var result = await GetUserSummaryReply(user.Id);
            return result;
        }
        public async override Task<UserSummaryReply> SetUserRole(SetUserRoleRequest request, ServerCallContext context)
        {
            await UpdateUserRoles(request.UserId.ToGuid().Value, request.RoleNames != null ? request.RoleNames.ToList() : new List<string>());
            return await GetUserSummaryReply(request.UserId.ToGuid().Value);
        }
        public async override Task<UserSummaryReply> SetUserState(SetUserStateRequest request, ServerCallContext context)
        {
            var user = _applicationDbContext.Users.FirstOrDefault(p => p.Id == request.UserId.ToGuid().Value);
            if (user == null)
                return new UserSummaryReply();

            user.IsActive = request.IsActive;
            await _applicationDbContext.SaveChangesAsync();
            return await GetUserSummaryReply(user.Id);
        }

        public async override Task<RoleInfos> GetAllRole(Empty request, ServerCallContext context)
        {

            var allRole = _applicationDbContext.Roles.ToList();
            RoleInfos roleInfos = new RoleInfos();
            foreach (var item in allRole)
            {
                roleInfos.RoleInfos_.Add(new RoleInfo()
                {
                    RoleId = item.Id.ToString(),
                    RoleName = item.Name,
                    RoleTitle = string.IsNullOrEmpty(item.DisplayName) ? " " : item.DisplayName
                });

            }
            return roleInfos;
            //var allRoleId = _applicationDbContext.UserRoles.Select(s => s.RoleId).ToList();
            //if (allRoleId != null && allRoleId.Any())
            //{
            //    var allRole = _applicationDbContext.Roles.Where(w => allRoleId.Contains(w.Id)).ToList();
            //    RoleInfos roleInfos = new RoleInfos();
            //    foreach (var item in allRole)
            //    {
            //        roleInfos.RoleInfos_.Add(new RoleInfo()
            //        {
            //            RoleId = item.Id.ToString(),
            //            RoleName = item.Name,
            //            RoleTitle = String.IsNullOrEmpty(item.DisplayName) ? " " : item.DisplayName
            //        });

            //    }
            //    return roleInfos;
            //}
            //return null;
        }
        public async override Task<RoleInfos> GetUserRole(GetByIdRequest request, ServerCallContext context)
        {
            var allRoleId = _applicationDbContext.UserRoles.Where(w => w.UserId == request.UserId.ToGuid()).Select(s => s.RoleId).ToList();
            if (allRoleId != null && allRoleId.Any())
            {
                var allRole = _applicationDbContext.Roles.Where(w => allRoleId.Contains(w.Id)).ToList();
                RoleInfos roleInfos = new RoleInfos();
                foreach (var item in allRole)
                {
                    roleInfos.RoleInfos_.Add(new RoleInfo()
                    {
                        RoleId = item.Id.ToString(),
                        RoleName = item.Name,
                        RoleTitle = string.IsNullOrEmpty(item.DisplayName) ? " " : item.DisplayName
                    });

                }
                return roleInfos;
            }
            return null;
        }

        public async override Task<UserHasAccessResonse> UserHasAccess(UserHasAccessRequest request, ServerCallContext context)
        {
            UserHasAccessResonse userHasAccessResonse = new UserHasAccessResonse();

            bool persianAccess = request.LanguageId == 1;
            // LanguageId 0 = caller did not specify — do not filter by HasPersianAccess
            // (otherwise Persian-only AccessRoles are denied for endpoints without {lang}).
            var ignorePersianFlag = request.LanguageId == 0;

            var q = from a in _applicationDbContext.AccessRoles
                    join r in _applicationDbContext.UserRoles on a.RoleId equals r.RoleId
                    join m in _applicationDbContext.AccessMenus on a.AccessMenuId equals m.AccessMenuId
                    join f in _applicationDbContext.AccessForms on m.AccessFormId equals f.AccessFormId
                    where
                    r.UserId == request.UserId.ToGuid() &&
                    (ignorePersianFlag || !a.HasPersianAccess.HasValue || a.HasPersianAccess == persianAccess) &&
                    request.AccessFormId.Contains(f.AccessFormId)
                    select a.AccessRoleId;


            userHasAccessResonse.HasAccess = q.Any();
            return userHasAccessResonse;

        }

        public async override Task<UserSummaryRoles> GetUserRoles(GetByIdsRequest request, ServerCallContext context)
        {
            var allUserId = request.UserIds.Select(s => s.ToGuid());
            var q = (from u in _applicationDbContext.Users
                     join r in _applicationDbContext.UserRoles on u.Id equals r.UserId
                     join n in _applicationDbContext.Roles on r.RoleId equals n.Id
                     where allUserId.Contains(u.Id)
                     select new
                     {
                         u.Id,
                         r.RoleId,
                         n.Name,
                         n.DisplayName
                     }).ToList();

            var grupedQuery = q.GroupBy(g => g.Id).Select(s => new { UserId = s.Key, Roles = s.Select(i => new { i.Name, i.DisplayName, i.RoleId }) });

            var result = new UserSummaryRoles();

            foreach (var item in grupedQuery)
            {
                var summaryRole = new UserSummaryRole() { UserId = item.UserId.ToString() };
                foreach (var itm in item.Roles)
                {
                    summaryRole.RoleInfos.Add(new RoleInfo() { RoleId = itm.RoleId.ToString(), RoleName = itm.Name, RoleTitle = itm.DisplayName });
                }
                result.RoleInfos.Add(summaryRole);
            }

            return result;

        }

        public async override Task<UserHasAccessResonse> UserIsActive(GetByIdRequest request, ServerCallContext context)
        {
            var user = _applicationDbContext.Users.FirstOrDefault(p => p.Id == request.UserId.ToGuid());
            if (user == null || !user.IsActive)
            {
                return new UserHasAccessResonse() { HasAccess = false };
            }
            return new UserHasAccessResonse() { HasAccess = true };
        }

        private async Task UpdateUserRoles(Guid userId, List<string> roleNames)
        {
            if (userId == Guid.Empty)
                return;
            var allCurrentUserRole = _applicationDbContext.UserRoles.Where(w => w.UserId == userId).ToList();
            foreach (var item in allCurrentUserRole)
            {
                _applicationDbContext.UserRoles.Remove(item);
            }
            await _applicationDbContext.SaveChangesAsync();

            var roles = _applicationDbContext.Roles.Where(w => roleNames.Contains(w.Name)).ToList();
            foreach (var role in roles)
            {
                if (!_applicationDbContext.UserRoles.Any(a => a.RoleId == role.Id && a.UserId == userId))
                    _applicationDbContext.UserRoles.Add(new IdentityUserRole<Guid>() { RoleId = role.Id, UserId = userId });
            }
            await _applicationDbContext.SaveChangesAsync();
        }
        private async Task<UserSummaryReply> GetUserSummaryReply(Guid userId)
        {
            var user = _applicationDbContext.Users.FirstOrDefault(p => p.Id == userId);
            if (user == null)
                return new UserSummaryReply();

            var result = new UserSummaryReply()
            {
                Email = user.Email ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                PhoneNumber = user.PhoneNumber ?? "",
                UserId = user.Id.ToString(),
                UserName = user.UserName ?? "",
                DepartmentId = (int)user.DepartmentId,
                IsActive = user.IsActive,
                DepartmentName = user.DepartmentId.GetDisplayName(),
                LastLoginIP = user.LastLoginIP ?? string.Empty,
                LastLoginDate = user.LastLoginDate.HasValue ? ((DateTimeOffset)user.LastLoginDate.Value).ToUnixTimeSeconds() : 0,
                TwoFactorEnabled = user.TwoFactorEnabled,
            };
            var allRoleId = _applicationDbContext.UserRoles.Where(w => w.UserId == user.Id).Select(s => s.RoleId).ToList();
            if (allRoleId != null && allRoleId.Any())
            {
                var allRole = _applicationDbContext.Roles.Where(w => allRoleId.Contains(w.Id)).ToList();
                foreach (var item in allRole)
                {
                    result.RoleInfos.Add(new RoleInfo()
                    {
                        RoleId = item.Id.ToString(),
                        RoleName = item.Name,
                        RoleTitle = string.IsNullOrEmpty(item.DisplayName) ? " " : item.DisplayName
                    });

                }
            }
            return result;
        }

        public async override Task<UserSummariesReply> GetByIds(GetByIdsRequest request, ServerCallContext context)
        {
            var allUserId = request.UserIds.Select(s => s.ToGuid()).ToList();
            UserSummariesReply userSummariesReply = new UserSummariesReply();
            var userSummaries = _applicationDbContext.Users.Where(p => allUserId.Contains(p.Id)).Select(user => new UserSummaryReply()
            {
                Email = user.Email ?? "",
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                PhoneNumber = user.PhoneNumber ?? "",
                UserId = user.Id.ToString(),
                UserName = user.UserName ?? "",
                DepartmentId = (int)user.DepartmentId,
                IsActive = user.IsActive,
                DepartmentName = user.DepartmentId.GetDisplayName(),
                LastLoginIP = user.LastLoginIP,
                LastLoginDate = user.LastLoginDate.HasValue ? ((DateTimeOffset)user.LastLoginDate.Value).ToUnixTimeSeconds() : 0,
            });
            foreach (var item in userSummaries)
            {
                userSummariesReply.UserSummaries.Add(item);
            }
            return userSummariesReply;
        }
        public async override Task<UserIdsReply> GetRelatedUserRole(GetByRoleNameRequest request, ServerCallContext context)
        {
            if (request == null || request.RoleNames == null || !request.RoleNames.Any())
                return new UserIdsReply();

            var roles = request.RoleNames.ToList();

            var q = (from u in _applicationDbContext.Users
                     join ur in _applicationDbContext.UserRoles on u.Id equals ur.UserId
                     join r in _applicationDbContext.Roles on ur.RoleId equals r.Id
                     where roles.Contains(r.Name)
                     select u.Id).ToList();

            var result = new UserIdsReply();
            foreach (var item in q)
            {
                result.UserIds.Add(item.ToString());
            }

            return result;
        }

        public async override Task<UserSummaryReply> SetUserSystemRole(SetUserSystemRoleRequest request, ServerCallContext context)
        {
            _logger.LogWarning($"request Is Null: {request == null}");
            _logger.LogWarning($" AccessSystemId:{request.AccessSystemId}  UserId:{request.UserId}");
            foreach (var item in request.RoleNames)
                _logger.LogWarning($" Role {item}");

            var userId = request.UserId.ToGuid();
            if (!userId.HasValue || userId.Value == Guid.Empty)
                return new UserSummaryReply();

            await UpdateUserSystemRoles(userId.Value, request.AccessSystemId, request.RoleNames != null ? request.RoleNames.ToList() : new List<string>());
            return await GetUserSummaryReply(userId.Value);
        }

        private async Task UpdateUserSystemRoles(Guid userId, int accessSystemId, List<string> roleNames)
        {
            if (userId == Guid.Empty)
                return;

            var allRoleId = _applicationDbContext.AccessSystemRoles.Where(w => w.AccessSystemId == accessSystemId).Select(s => s.RoleId).ToList();
            var mustRemovedRoles = (from ur in _applicationDbContext.UserRoles
                                    join r in _applicationDbContext.Roles on ur.RoleId equals r.Id
                                    where allRoleId.Contains(r.Id) && ur.UserId == userId
                                    select ur).ToList();
            if (mustRemovedRoles.Any())
                _applicationDbContext.UserRoles.RemoveRange(mustRemovedRoles);
            await _applicationDbContext.SaveChangesAsync();
            await UpdateUserRoles(userId, roleNames);
        }

        public async override Task<UserPhoneNumberReply> GetRelatedUserRolePhoneNumber(GetRelatedUserRolePhoneNumberRequest request, ServerCallContext context)
        {
            if (request == null || request.RoleNames == null || !request.RoleNames.Any())
                return new UserPhoneNumberReply();

            var roles = request.RoleNames.ToList();

            var q = (from u in _applicationDbContext.Users
                     join ur in _applicationDbContext.UserRoles on u.Id equals ur.UserId
                     join r in _applicationDbContext.Roles on ur.RoleId equals r.Id
                     where roles.Contains(r.Name)
                     select u.PhoneNumber).ToList();

            var result = new UserPhoneNumberReply();
            foreach (var item in q)
            {
                result.PhoneNumbers.Add(item.ToString());
            }

            return result;
        }

    }
}

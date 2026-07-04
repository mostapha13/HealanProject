
using Grpc.Core;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.GrpcClient.Interfaces
{
    public interface IIdentityTool
    {
        public Task<UserSummaryReply> GetUserSummaryInfo(GetByIdRequest request);
        Task<UserSummariesReply> GetUserSummaries(List<string> userIds);
        public Task<UserSummaryReply> SaveUser(SaveRequest request);
        public Task<UserSummaryReply> SetUserRole(SetUserRoleRequest request);
        public Task<UserSummaryReply> SetUserSystemRole(SetUserSystemRoleRequest request);
        public Task<UserSummaryReply> SetUserState(SetUserStateRequest request);

        public Task<RoleInfos> GetAllRole(Empty request);
        public Task<RoleInfos> GetUserRole(GetByIdRequest request);
        Task<UserHasAccessResonse> UserHasAccess(UserHasAccessRequest request);
        Task<UserSummaryRoles> GetUserRoles(GetByIdsRequest request);
        Task<bool> IsUserActive(Guid userId);
        Task<List<Guid>> GetRelatedUserRole(List<string> roleNames);
        Task<List<string>> GetRelatedUserRolePhoneNumber(List<string> roleNames);
    }
}

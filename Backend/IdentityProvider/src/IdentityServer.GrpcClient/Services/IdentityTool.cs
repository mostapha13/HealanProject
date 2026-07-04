using Grpc.Core;
using Grpc.Net.Client;
using IdentityServer.GrpcClient.Interfaces;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.GrpcClient.Services
{
    internal class IdentityTool : IIdentityTool
    {
        UserService.UserServiceClient client;
        public IdentityTool(IConfiguration configuration)
        {
            var httpHandler = new HttpClientHandler();
            httpHandler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            var channel = GrpcChannel.ForAddress(configuration["GrpcServer:IdentityServer"], new GrpcChannelOptions { HttpHandler = httpHandler });
            client = new UserService.UserServiceClient(channel);

        }

        public async Task<RoleInfos> GetAllRole(Empty request)
        {
            var result = client.GetAllRole(request);
            return result;
        }

        public async Task<RoleInfos> GetUserRole(GetByIdRequest request)
        {
            var result = client.GetUserRole(request);
            return result;
        }

        public async Task<UserSummaryReply> GetUserSummaryInfo(GetByIdRequest request)
        {
            var result = await client.GetByIdAsync(request);
            return result;
        }
        public async Task<UserSummariesReply> GetUserSummaries(List<string> userIds)
        {
            UserSummariesReply userSummariesReply = new UserSummariesReply();
            if (userIds == null || !userIds.Any())
                return userSummariesReply;
            var idsRequest = new GetByIdsRequest();
            foreach (var item in userIds)
            {
                idsRequest.UserIds.Add(item);
            }
            var result = await client.GetByIdsAsync(idsRequest);
            return result;
        }

        public async Task<UserSummaryReply> SaveUser(SaveRequest request)
        {
            var result = await client.SaveUserAsync(request);
            return result;
        }
        public async Task<UserSummaryReply> SetUserRole(SetUserRoleRequest request)
        {
            var result = await client.SetUserRoleAsync(request);
            return result;
        }
        public async Task<UserSummaryReply> SetUserSystemRole(SetUserSystemRoleRequest request)
        {
            var result = await client.SetUserSystemRoleAsync(request);
            return result;
        }
        public async Task<UserSummaryReply> SetUserState(SetUserStateRequest request)
        {
            var result = await client.SetUserStateAsync(request);
            return result;
        }

        public async Task<UserHasAccessResonse> UserHasAccess(UserHasAccessRequest request)
        {
            var result = client.UserHasAccess(request);
            return result;
        }
        public async Task<UserSummaryRoles> GetUserRoles(GetByIdsRequest request)
        {
            var result = await client.GetUserRolesAsync(request);
            return result;
        }

        public async Task<bool> IsUserActive(Guid userId)
        {
            var result = client.UserIsActive(new GetByIdRequest() { UserId = userId.ToString() });

            if (result == null)
                return false;
            return result.HasAccess;
        }
        public async Task<List<Guid>> GetRelatedUserRole(List<string> roleNames)
        {
            if (roleNames == null || !roleNames.Any())
                return new List<Guid>();
            var request = new GetByRoleNameRequest();
            foreach (var item in roleNames)
            {
                request.RoleNames.Add(item);
            }
            var result = await client.GetRelatedUserRoleAsync(request);

            List<Guid> userIds = new List<Guid>();
            foreach (var item in result.UserIds)
            {
                userIds.Add(Guid.Parse(item));
            }
            return userIds;
        }

        public async Task<List<string>> GetRelatedUserRolePhoneNumber(List<string> roleNames)
        {
            if (roleNames == null)
                return new List<string>();

            var request = new GetRelatedUserRolePhoneNumberRequest();
            foreach (var item in roleNames)
            {
                request.RoleNames.Add(item);
            }
            var result = await client.GetRelatedUserRolePhoneNumberAsync(request);
            List<string> phoneNumbers = new List<string>();
            foreach (var item in result.PhoneNumbers)
            {
                phoneNumbers.Add(item);
            }
            return phoneNumbers;
        }
    }
}

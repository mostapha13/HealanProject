using IdentityServer.GrpcClient;
using IdentityServer.GrpcClient.Interfaces;
using Share.Domain.Models.UserAccessModels;

namespace Healan.Application.Portal.Services;

/// <summary>
/// AspNet role helpers for public portal users (SiteUser quota + Patient menus).
/// </summary>
public static class PortalAspNetRoleHelper
{
    public const string SiteUserRole = nameof(UserAccesRoleId.SiteUser);
    public const string PatientRole = nameof(UserAccesRoleId.Patient);

    public static async Task EnsureAsync(
        IIdentityTool identityTool,
        Guid userId,
        bool includePatient)
    {
        try
        {
            var roleInfos = await identityTool.GetUserRole(new GetByIdRequest { UserId = userId.ToString() });
            var names = roleInfos?.RoleInfos_
                ?.Select(r => r.RoleName)
                .Where(n => !string.IsNullOrWhiteSpace(n))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList() ?? new List<string>();

            var changed = false;
            if (!names.Any(n => string.Equals(n, SiteUserRole, StringComparison.OrdinalIgnoreCase)))
            {
                names.Add(SiteUserRole);
                changed = true;
            }

            if (includePatient
                && !names.Any(n => string.Equals(n, PatientRole, StringComparison.OrdinalIgnoreCase)))
            {
                names.Add(PatientRole);
                changed = true;
            }

            if (!changed)
                return;

            var setRequest = new SetUserRoleRequest { UserId = userId.ToString() };
            foreach (var name in names)
                setRequest.RoleNames.Add(name);
            await identityTool.SetUserRole(setRequest);
        }
        catch
        {
            // نقش‌های پورتال نباید OTP / ثبت بیمار را بشکند.
        }
    }
}

using Healan.Application.Common.Interfaces;
using IdentityServer.GrpcClient.Interfaces;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Models.UserAccessModels;

namespace Healan.Application.Common.ClinicAccess;

public interface IClinicAccessScopeService
{
    Task<ClinicAccessScope> ResolveAsync(CancellationToken cancellationToken = default);
}

public sealed class ClinicAccessScopeService : IClinicAccessScopeService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IIdentityTool _identityTool;

    public ClinicAccessScopeService(
        IApplicationDbContext db,
        ICurrentUserService currentUser,
        IIdentityTool identityTool)
    {
        _db = db;
        _currentUser = currentUser;
        _identityTool = identityTool;
    }

    public async Task<ClinicAccessScope> ResolveAsync(CancellationToken cancellationToken = default)
    {
        var identityId = _currentUser.UserId;
        var roleNames = new List<string>();

        if (identityId != Guid.Empty)
        {
            try
            {
                var summary = await _identityTool.GetUserSummaryInfo(
                    new IdentityServer.GrpcClient.GetByIdRequest { UserId = identityId.ToString() });
                if (summary?.RoleInfos != null)
                {
                    foreach (var role in summary.RoleInfos)
                    {
                        if (!string.IsNullOrWhiteSpace(role.RoleName))
                            roleNames.Add(role.RoleName.Trim());
                    }
                }
            }
            catch
            {
                // Identity unavailable — fall through with empty roles
            }
        }

        var healanUser = identityId == Guid.Empty
            ? null
            : await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.IdentityUserId == identityId, cancellationToken);

        long? doctorId = null;
        long? companyId = healanUser?.CompanyId;

        if (healanUser != null)
        {
            var doctor = await _db.Doctors.AsNoTracking()
                .Where(d => d.UserId == healanUser.UserId)
                .Select(d => new { d.DoctorId, d.CompanyId })
                .FirstOrDefaultAsync(cancellationToken);

            if (doctor != null)
            {
                doctorId = doctor.DoctorId;
                companyId ??= doctor.CompanyId;
            }
        }

        var mode = ResolveMode(roleNames, doctorId, companyId);

        return new ClinicAccessScope
        {
            IdentityUserId = identityId,
            HealanUserId = healanUser?.UserId,
            CompanyId = companyId,
            DoctorId = doctorId,
            RoleNames = roleNames,
            Mode = mode,
        };
    }

    private static ClinicDataAccessMode ResolveMode(
        IReadOnlyList<string> roleNames,
        long? doctorId,
        long? companyId)
    {
        bool Has(string name) =>
            roleNames.Any(r => string.Equals(r, name, StringComparison.OrdinalIgnoreCase));

        if (Has(nameof(UserAccesRoleId.Admin)))
            return ClinicDataAccessMode.All;

        // پزشک — فقط ویزیت‌های خودش (حتی اگر رکورد Doctors هنوز ساخته نشده باشد)
        if (Has(nameof(UserAccesRoleId.Doctor)))
            return ClinicDataAccessMode.ByDoctor;

        // منشی / پذیرش / حسابدار — کلینیک
        if (Has(nameof(UserAccesRoleId.Secretary))
            || Has(nameof(UserAccesRoleId.Healan))
            || Has(nameof(UserAccesRoleId.Accountant)))
        {
            return ClinicDataAccessMode.ByCompany;
        }

        if (doctorId is > 0)
            return ClinicDataAccessMode.ByDoctor;

        return ClinicDataAccessMode.None;
    }
}

using Microsoft.AspNetCore.Identity;
namespace TSEAI.Identity.Domain.Entities;
public sealed class ApplicationUser : IdentityUser<Guid>
{
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
}

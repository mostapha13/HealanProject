namespace IdentityServer.Domain.Entities;

/// <summary>A direct, explicit user denial. For non-admin users it overrides role and direct grants.</summary>
public class AccessUserDeny
{
    public int AccessUserDenyId { get; set; }
    public Guid UserId { get; set; }
    public int AccessMenuId { get; set; }
    public int AccessSystemId { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedUtc { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime? ModifiedUtc { get; set; }
    public Guid? ModifiedBy { get; set; }
    public DateTime? DeletedUtc { get; set; }
    public Guid? DeletedBy { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public AccessMenu AccessMenu { get; set; } = null!;
    public AccessSystem AccessSystem { get; set; } = null!;
}

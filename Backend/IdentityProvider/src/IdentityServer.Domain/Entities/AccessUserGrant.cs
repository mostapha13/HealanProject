namespace IdentityServer.Domain.Entities;

/// <summary>
/// An additive menu grant assigned directly to a user.
/// </summary>
public class AccessUserGrant
{
    public int AccessUserGrantId { get; set; }
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

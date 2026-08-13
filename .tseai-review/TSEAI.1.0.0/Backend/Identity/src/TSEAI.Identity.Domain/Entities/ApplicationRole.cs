using Microsoft.AspNetCore.Identity;
namespace TSEAI.Identity.Domain.Entities;
public sealed class ApplicationRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public ApplicationRole() { }
    public ApplicationRole(string name) { Name = name; NormalizedName = name.ToUpperInvariant(); }
}

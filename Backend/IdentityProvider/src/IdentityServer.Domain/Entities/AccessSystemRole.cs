namespace IdentityServer.Domain.Entities
{
    public class AccessSystemRole
    {
        public int AccessSystemRoleId { get; set; }
        public Guid RoleId { get; set; }
        public int AccessSystemId { get; set; }

        public ApplicationRole ApplicationRole { get; set; }
        public AccessSystem AccessSystem { get; set; }
    }
}

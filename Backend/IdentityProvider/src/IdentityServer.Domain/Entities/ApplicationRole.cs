using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace IdentityServer.Domain.Entities
{
    public class ApplicationRole : IdentityRole<Guid>
    {
        public ApplicationRole()
        {
            ApplicationUserAccesses = new Collection<ApplicationUserAccess>();
            AccessSystemRoles = new Collection<AccessSystemRole>();
        }

        public ApplicationRole(string name) : base(name)
        {
            ApplicationUserAccesses = new Collection<ApplicationUserAccess>();
            AccessSystemRoles = new Collection<AccessSystemRole>();
        }
        public string DisplayName { get; set; }
        public Guid? ApplicationRoleGroupId { get; set; }
        public ApplicationRoleGroup ApplicationRoleGroup { get; set; }

        public ICollection<ApplicationUserAccess> ApplicationUserAccesses { get; set; }
        public ICollection<AccessSystemRole> AccessSystemRoles { get; set; }
    }
}

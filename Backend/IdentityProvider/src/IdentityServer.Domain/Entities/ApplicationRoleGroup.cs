using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
   public class ApplicationRoleGroup
    {
        public ApplicationRoleGroup()
        {
            ApplicationRoles = new Collection<ApplicationRole>();
            ApplicationUserAccesses = new Collection<ApplicationUserAccess>();
        }
        public Guid ApplicationRoleGroupId { get; set; }
        public string ApplicationRoleGroupName { get; set; }
        public string  DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public ICollection<ApplicationRole> ApplicationRoles { get; set; }
        public ICollection<ApplicationUserAccess> ApplicationUserAccesses { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
    public class AccessRole
    {
        public int AccessRoleId { get; set; }
        public Guid RoleId { get; set; }
        public int AccessMenuId { get; set; }
        public bool? HasPersianAccess { get; set; }
        public AccessMenu AccessMenu { get; set; }

    }
}

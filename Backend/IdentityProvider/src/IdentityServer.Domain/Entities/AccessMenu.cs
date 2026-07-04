using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
    public class AccessMenu
    {
        public AccessMenu()
        {
            Children = new Collection<AccessMenu>();
            AccessRoles=new Collection<AccessRole>();
        }
        public int AccessMenuId { get; set; }
        public int? AccessFormId { get; set; }
        public int? ParentRef { get; set; }
        public int Order { get; set; }
        public AccessMenu Parent { get; set; }
        public AccessForm AccessForm { get; set; }
        public ICollection<AccessMenu> Children { get; set; }
        public ICollection<AccessRole> AccessRoles { get; set; }

    }
}

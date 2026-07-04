using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
    public class AccessSystem
    {
        public AccessSystem()
        {
            AccessForms=new List<AccessForm>();
            ApplicationRoles= new List<ApplicationRole>();
        }
        public int AccessSystemId { get; set; }
        public string SystemName { get; set; }
        public string SystemTitle { get; set; }
        public ICollection<AccessForm> AccessForms { get; set; }
        public ICollection<ApplicationRole> ApplicationRoles { get; set; }
        public ICollection<AccessSystemRole> AccessSystemRoles { get; set; }
    }
}

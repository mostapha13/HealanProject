using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
    public class AccessForm
    {
        public AccessForm()
        {
            AccessMenus = new Collection<AccessMenu>();
        }
        public int AccessFormId { get; set; }
        public int AccessSystemId { get; set; }
        public string FormTitle { get; set; }
        public string URL { get; set; }
        public AccessSystem AccessSystem { get; set; }
        public ICollection<AccessMenu> AccessMenus { get; set; }
    }
}

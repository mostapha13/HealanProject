using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
   public class ActionInfo
    {
        public ActionInfo()
        {
            ApplicationUserAccesses = new Collection<ApplicationUserAccess>();
        }
        public int ActionInfoId { get; set; }
        public int SectionInfoId { get; set; }
        public string ActionInfoName { get; set; }
        public string DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public SectionInfo SectionInfo { get; set; }
        public ICollection<ApplicationUserAccess> ApplicationUserAccesses { get; set; }
    }
}

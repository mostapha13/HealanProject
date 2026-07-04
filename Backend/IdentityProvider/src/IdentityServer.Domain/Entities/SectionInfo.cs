using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
   public class SectionInfo
    {
        public SectionInfo()
        {
            ActionInfos = new Collection<ActionInfo>();
        }

        public int SectionInfoId { get; set; }
        public int SubSystemId { get; set; }
        public string SectionInfoName { get; set; }
        public string DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public SubSystemInfo SubSystem { get; set; }
        public ICollection<ActionInfo> ActionInfos { get; set; }
    }
}

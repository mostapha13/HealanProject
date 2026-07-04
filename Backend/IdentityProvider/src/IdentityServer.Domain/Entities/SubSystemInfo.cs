using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
   public class SubSystemInfo
    {
        public SubSystemInfo()
        {
            SectionInfos = new Collection<SectionInfo>();
        }
        public int SubSystemInfoId { get; set; }
        public string SubSystemInfoName { get; set; }
        public string DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public ICollection<SectionInfo> SectionInfos { get; set; }
    }
}

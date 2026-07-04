using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public abstract class UserAccessBase
    {
        public int Key { get; set; }
        public string DisplayName { get; set; }
        public int DisplayOrder { get; set; }
        public abstract bool HasAccess { get; set; }
        public abstract AccessMode AccessMode { get; set; }
    }
}

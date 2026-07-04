using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Share.Domain.Messages
{
    public class FileInfoMessage
    {
        public Guid? FileId { get; set; }
        public SystemTypeId System{ get; set; }
        public int SubSystem { get; set; }
        public bool IsNew { get; set; }

    }
}

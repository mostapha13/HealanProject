using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public enum AccessMode : byte
    {
        HasAccess = 1,
        AccessDenied = 2,
        GroupAccess = 3
    }
}

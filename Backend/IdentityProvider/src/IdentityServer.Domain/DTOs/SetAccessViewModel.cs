using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IdentityServer.Domain.DTOs
{
    public class SetAccessViewModel
    {
        public int? SubsystemId { get; set; }
        public int? SectionId { get; set; }
        public int? ActionId { get; set; }
        
        public Guid? GroupRoleId { get; set; }
        public Guid? RoleId { get; set; }
        public AccessMode AccessMode { get; set; }
    }
}

using Share.Domain.Models.UserAccessModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IdentityServer.Domain.Entities
{
    public class ApplicationUserAccess
    {
        public ApplicationUserAccess()
        {
    
        }
        public Guid ApplicationUserAccessId { get; set; }
        public Guid? ApplicationRoleId { get; set; }
        public Guid? ApplicationRoleGroupId { get; set; }
        public int ActionInfoId { get; set; }
        public AccessMode AccessMode { get; set; }


        public ApplicationRole ApplicationRole { get; set; }
        public ApplicationRoleGroup ApplicationRoleGroup { get; set; }
        public ActionInfo ActionInfo { get; set; }

    }
}

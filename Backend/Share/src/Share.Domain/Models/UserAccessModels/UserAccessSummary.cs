using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public class UserAccessSummary : UserAccessBase
    {
        public UserAccessSummary()
        {
            UserAccessSections = new List<UserAccessSection>();
            RoleInfos = new List<EnumInfo>();
        }
        public string SubSystemName { get; set; }
        public IEnumerable<UserAccessSection> UserAccessSections { get; set; }
        public IEnumerable<EnumInfo> RoleInfos { get; set; }
        public override bool HasAccess
        {
            get
            {
                return UserAccessSections != null && UserAccessSections.All(a => a.HasAccess);
            }
            set
            {
                if (UserAccessSections != null)
                {
                    foreach (var item in UserAccessSections)
                    {
                        item.HasAccess = value;
                    }
                }
            }
        }
        public override AccessMode AccessMode
        {
            get
            {
                if (UserAccessSections != null)
                {
                    if (UserAccessSections.All(a => a.AccessMode == AccessMode.GroupAccess))
                        return AccessMode.GroupAccess;
                    else if (UserAccessSections.All(a => a.HasAccess))
                        return AccessMode.HasAccess;
                    else 
                        return AccessMode.AccessDenied;
                }
                return AccessMode.AccessDenied;
            }
            set
            {
                if (UserAccessSections != null)
                {
                    foreach (var item in UserAccessSections)
                    {
                        item.AccessMode = value;
                    }
                }
            }
        }
    }
}

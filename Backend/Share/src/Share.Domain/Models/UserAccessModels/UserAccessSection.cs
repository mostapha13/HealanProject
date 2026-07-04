using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public class UserAccessSection : UserAccessBase
    {
        public UserAccessSection()
        {
            UserAccessActions = new List<UserAccessAction>();
        }
        public string SectionName { get; set; }

        public IEnumerable<UserAccessAction> UserAccessActions { get; set; }
        public override bool HasAccess
        {
            get
            {
                return UserAccessActions != null && UserAccessActions.All(a => a.HasAccess);
            }
            set
            {
                if (UserAccessActions != null)
                {
                    foreach (var item in UserAccessActions)
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
                if (UserAccessActions != null)
                {
                    if (UserAccessActions.All(a => a.AccessMode == AccessMode.GroupAccess))
                        return AccessMode.GroupAccess;
                    else if (UserAccessActions.All(a => a.HasAccess))
                        return AccessMode.HasAccess;
                    else
                        return AccessMode.AccessDenied;
                }
                return AccessMode.AccessDenied;
            }
            set
            {
                if (UserAccessActions != null)
                {
                    foreach (var item in UserAccessActions)
                    {
                        item.AccessMode = value;
                    }
                }
            }
        }
    }
}

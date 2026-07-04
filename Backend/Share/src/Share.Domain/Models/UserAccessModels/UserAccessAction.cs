using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Domain.Models.UserAccessModels
{
    public class UserAccessAction:UserAccessBase
    {
        private bool hasAccess = false;
        public UserAccessAction()
        {
        }
        public string ActionName { get; set; }
        public override bool HasAccess { get; set; }
        public override AccessMode AccessMode { get ; set; }
    }
}
